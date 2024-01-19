import { Bot, Context, session, SessionFlavor } from "https://deno.land/x/grammy@v1.20.3/mod.ts";
import { I18n, I18nFlavor } from "https://deno.land/x/grammy_i18n@v1.0.1/mod.ts";
import { Menu } from "https://deno.land/x/grammy_menu@v1.2.1/mod.ts";
import { parseMode } from "https://deno.land/x/grammy_parse_mode@1.7.1/mod.ts";
import { load } from "https://deno.land/std@0.212.0/dotenv/mod.ts";

interface SessionData {
    __language_code?: string;
    flameEnabled: boolean;
    lastPinnedMessageId?: number;
    flamers: { [userId: string]: number };
    flameStartedAt?: number;

    popcorns: {
        [type: string]: {
            emoji: string;
            takenTimes: number;
            takenBy?: number[];
        };
    }
}

const popcornTypes = {
    buttered: { emoji: "🍿", takenTimes: 0 },
    caramel: { emoji: "🍯", takenTimes: 0 },
    cheese: { emoji: "🧀", takenTimes: 0 },
    spicy: { emoji: "🌶️", takenTimes: 0 },
    sweet: { emoji: "🍬", takenTimes: 0 },
};

type BotContext = Context & SessionFlavor<SessionData> & I18nFlavor;
const env = await load();
const bot = new Bot<BotContext>(env["BOT_TOKEN"]);
const i18n = new I18n<BotContext>({
    defaultLocale: "en",
    useSession: true,
    directory: "locales",
});
function initial(): SessionData {
    return {
        flameEnabled: false,
        flamers: {},
        popcorns: popcornTypes,
    };
}
bot.api.config.use(parseMode("HTML"));
await bot.api.setMyCommands([
    { command: "flame", description: "Starts or stops the flame session" },
]);
await bot.api.setMyDefaultAdministratorRights({
    for_channels: false,
    rights: {
        can_change_info: false,
        can_delete_messages: false,
        can_invite_users: false,
        can_restrict_members: false,
        can_pin_messages: true,
        can_promote_members: false,
        is_anonymous: false,
        can_manage_chat: false,
        can_manage_video_chats: false,
    },
});
bot.use(session({ initial }));
bot.use(i18n);

const menu = new Menu<BotContext>("popcorn_chooser");
menu
    .dynamic((ctx, range) => {
        const flavorKeys = Object.keys(popcornTypes) as Array<keyof typeof popcornTypes>;

        for (let i = 0; i < flavorKeys.length; i++) {
            const flavor = flavorKeys[i];

            const username = ctx.me.username;
            const encodedFlavor = encodeURIComponent(flavor);
            const encodedUserId = encodeURIComponent(ctx.from?.id!);
            const encodedChatId = encodeURIComponent(ctx.chat?.id!);

            const link = `https://t.me/${username}?start=take-${encodedFlavor}-${encodedUserId}-${encodedChatId}`;
            const button = range.url(popcornTypes[flavor].emoji, link);
            // only add .row if there are more than 3 buttons in a row
            if (i % 3 === 0) {
                button.row();
            }
        }
    })
bot.use(menu);

bot.chatType("private").command("start", async (ctx: BotContext) => {
    const deepLink = ctx.match;
    // match will be take-flavor-userid-chatid
    if (typeof deepLink === "string" && deepLink.startsWith("take")) {
        const [_, flavor, userId, chatId] = deepLink.split("-");

        // check if the user has already taken any popcorn
        for (const type in ctx.session.popcorns) {
            if (ctx.session.popcorns[type].takenBy?.includes(Number(userId))) {
                await ctx.reply(ctx.t("already-took-flavor", { group: chatId }));
                return;
            }
        }

        const popcorn = ctx.session.popcorns[flavor];
        popcorn.takenTimes++;
        popcorn.takenBy = popcorn.takenBy || [];
        popcorn.takenBy.push(Number(userId));

        await ctx.reply(ctx.t("took-flavor", { flavor: flavor, group: chatId }));
    } else {
        // send a link to add the bot to a group. the bot must have pin permission
        const botUsername = ctx.me.username;
        const link = `https://t.me/${botUsername}?startgroup=true`;
        await ctx.reply(ctx.t("start-private"), { reply_markup: { inline_keyboard: [[{ text: ctx.t("add-to-group"), url: link }]] } });
    }
});

bot.chatType(["group", "supergroup"])
    .filter(async (ctx: BotContext) => {
        const admins = await ctx.getChatAdministrators();
        const isAdmin = admins.some((admin) => admin.user.id === ctx.from?.id);
        return isAdmin;
    })
    .command("flame", async (ctx: BotContext) => {
        if (ctx.session.flameEnabled) {
            await stopFlameSession(ctx);
        } else {
            await startFlameSession(ctx);
        }
    });

// bot on join group
bot.on(":new_chat_members:me", async (ctx: BotContext) => {
    await ctx.reply(ctx.t("bot-joined"));
});

bot.on("message", (ctx: BotContext) => {
    if (ctx.session.flameEnabled) {
        const fromId = ctx.message?.from?.id;
        if (!fromId || fromId == ctx.me.id) return;
        ctx.session.flamers[fromId] = (ctx.session.flamers[fromId] || 0) + ctx.message?.text?.length!;
    }
});


const getPositionEmoji = (position: number): string => {
    return position <= 3 ? ["🥇", "🥈", "🥉"][position - 1] : "";
}

const getFlamerInfo = async (userId: number, ctx: BotContext, position: number): Promise<string> => {
    const member = await ctx.getChatMember(userId);
    const firstName = member.user.first_name;

    const messageCount = ctx.session.flamers[userId];
    const formattedUser = `<a href="tg://user?id=${userId}">${firstName}</a>`;
    const positionEmoji = getPositionEmoji(position);

    const formattedMessage = ctx.t("top-flamers-layout", { rankemoji: positionEmoji, name: formattedUser, characters: messageCount });
    return formattedMessage;
};

async function startFlameSession(ctx: BotContext) {
    ctx.session.flameEnabled = true;
    ctx.session.flameStartedAt = Date.now();

    // get the last pinned message
    const chat = await ctx.getChat();
    ctx.session.lastPinnedMessageId = chat.pinned_message?.message_id;

    const flavors = ctx.session.popcorns;
    const flavorList = Object.keys(flavors).map((type) => {
        const flavor = ctx.session.popcorns[type];
        return `${flavor.emoji} ${type}`;
    }).join("\n");

    const flameMessage = await ctx.reply(ctx.t("flame-started", { flavors: flavorList }), { reply_markup: menu });
    await ctx.pinChatMessage(flameMessage.message_id, { disable_notification: true });
}

const getFlamersMessage = async (ctx: BotContext): Promise<string> => {
    const flamers = ctx.session.flamers;

    // check if all flamers have 0 messages
    if (Object.keys(flamers).length === 0) {
        return ctx.t("no-flamers");
    }

    const sortedFlamers = Object.keys(flamers).sort((a, b) => flamers[b] - flamers[a]);
    const topFlamers = sortedFlamers.slice(0, 3);
    const topFlamersMessages = await Promise.all(
        topFlamers.map(async (userId, index) => {
            return await getFlamerInfo(Number(userId), ctx, index + 1);
        }),
    );
    const topFlamersMessage = topFlamersMessages.join("\n");
    return topFlamersMessage;
}

const getFlavorsMessage = (ctx: BotContext): string => {
    const flavors = ctx.session.popcorns;

    // check if all flavors have 0 takenTimes
    const allZero = Object.keys(flavors).every((type) => flavors[type].takenTimes === 0);
    if (allZero) {
        return ctx.t("no-flavors");
    }

    const sortedFlavors = Object.keys(flavors).sort((a, b) => flavors[b].takenTimes - flavors[a].takenTimes);
    const topFlavors = sortedFlavors.slice(0, 3);
    const topFlavorsMessages = topFlavors
    .filter((type) => {
        const flavor = ctx.session.popcorns[type];
        return flavor.takenTimes > 0;
    })
    .map((type) => {
        const flavor = ctx.session.popcorns[type];
        return `${flavor.emoji} (${type}) - ${flavor.takenTimes}`;
    });
    const topFlavorsMessage = topFlavorsMessages.join("\n");
    return topFlavorsMessage;
}

async function stopFlameSession(ctx: BotContext) {
    ctx.session.flameEnabled = false;

    // unpin the flame message
    await ctx.unpinChatMessage(ctx.session.lastPinnedMessageId);

    const lastPinnedMessageId = ctx.session.lastPinnedMessageId;
    if (lastPinnedMessageId) {
        await ctx.pinChatMessage(lastPinnedMessageId, { disable_notification: true });
        ctx.session.lastPinnedMessageId = undefined;
    }

    const flameDuration = Date.now() - ctx.session.flameStartedAt!;
    const topFlamersMessage = await getFlamersMessage(ctx);
    const topFlavorsMessage = getFlavorsMessage(ctx);

    const hours = Math.floor(flameDuration / 1000 / 60 / 60);
    const minutes = Math.floor(flameDuration / 1000 / 60) % 60;
    const seconds = Math.floor(flameDuration / 1000) % 60;

    // reset flamers
    ctx.session.flamers = {};
    // reset popcorns
    for (const type in ctx.session.popcorns) {
        ctx.session.popcorns[type].takenTimes = 0;
        ctx.session.popcorns[type].takenBy = [];
    }
    // reset flameStartedAt
    ctx.session.flameStartedAt = undefined;

    await ctx.reply(ctx.t("flame-stopped", { topFlamers: topFlamersMessage, topFlavors: topFlavorsMessage, hours: hours, minutes: minutes, seconds: seconds }));
}

console.log("Bot started");
bot.start();

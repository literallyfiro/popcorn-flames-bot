import { Bot, Context, GrammyError, HttpError, SessionFlavor, session } from "https://deno.land/x/grammy@v1.20.3/mod.ts";
import { I18n, I18nFlavor } from "https://deno.land/x/grammy_i18n@v1.0.1/mod.ts";
import { Menu } from "https://deno.land/x/grammy_menu@v1.2.1/mod.ts";
import { parseMode } from "https://deno.land/x/grammy_parse_mode@1.7.1/mod.ts";
import { run } from "https://deno.land/x/grammy_runner@v2.0.3/mod.ts";
import env from "./env.ts";
import groups, { GroupData, fetchGroup } from "./mongo.ts";

interface SessionData {
    __language_code?: string;
}

type BotContext = Context & SessionFlavor<SessionData> & I18nFlavor;

const bot = new Bot<BotContext>(env["BOT_TOKEN"]);
const i18n = new I18n<BotContext>({
    defaultLocale: "en",
    useSession: true,
    directory: "locales",
});
bot.api.config.use(parseMode("HTML"));
await bot.api.setMyCommands([
    { command: "flame", description: "Starts or stops the flame session" },
    { command: "language", description: "Sets the language of the bot" },
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
bot.catch(async (err) => {
    const ctx = err.ctx;
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
    await ctx.reply("An error occurred while processing your request");
});
// @ts-ignore deno.
bot.use(session({ initial: () => ({ __language_code: "en" }) }));
bot.use(i18n);

const popcornMenu = new Menu<BotContext>("popcorn-menu").dynamic(async (ctx, range) => {
    const group = await fetchGroup(ctx.chat?.id!);
    const flavorKeys = Object.keys(group.popcorns);

    for (let i = 0; i < flavorKeys.length; i++) {
        const flavor = flavorKeys[i];

        const username = ctx.me.username;
        const userId = ctx.from?.id!;
        const chatId = ctx.chat?.id!;
        const language = await ctx.i18n.getLocale();

        const link = `https://t.me/${username}?start=take_${flavor}_${userId}_${chatId}_${language}`;
        const button = range.url(group.popcorns[flavor].emoji, link);
        // only add .row if there are more than 3 buttons in a row
        if (i % 3 === 0) {
            button.row();
        }
    }
});
const languageMenu = new Menu<BotContext>("language-menu").dynamic((_, range) => {
    const locales = i18n.locales;
    for (let i = 0; i < locales.length; i++) {
        const button = range.text(locales[i], async (ctx) => {
            await ctx.deleteMessage();
            await ctx.i18n.setLocale(locales[i]);
            await ctx.reply(ctx.t("language-set"));
        });
        if (i % 3 === 0) {
            button.row();
        }
    }
});
bot.use(popcornMenu);
bot.use(languageMenu);


bot.chatType("private").command("start", async (ctx: BotContext) => {
    const deepLink = ctx.match;
    // match will be take-flavor-userid-chatid
    if (typeof deepLink === "string" && deepLink.startsWith("take")) {
        const [_, flavor, userId, chatId, language] = deepLink.split("_");

        groups.findOne({ _id: parseInt(chatId) }).then(async (group) => {
            if (group) {
                // check if the user has already taken any popcorn
                for (const type in group.popcorns) {
                    if (group.popcorns[type].takenBy?.includes(parseInt(userId))) {
                        await ctx.reply(ctx.t("already-took-flavor", { group: chatId }));
                        return;
                    }
                }

                const popcorn = group.popcorns[flavor];
                popcorn.takenTimes++;
                popcorn.takenBy = popcorn.takenBy || [];
                popcorn.takenBy.push(parseInt(userId));

                await groups.replaceOne({ _id: parseInt(chatId) }, group);

                const oldLanguage = await ctx.i18n.getLocale();
                await ctx.i18n.setLocale(language);
                await ctx.reply(ctx.t("took-flavor", { flavor: flavor, group: chatId }));
                await ctx.i18n.setLocale(oldLanguage);
            }
        });
    } else {
        // send a link to add the bot to a group. the bot must have pin permission
        const botUsername = ctx.me.username;
        const link = `https://t.me/${botUsername}?startgroup=true`;
        await ctx.reply(ctx.t("start-private"), { reply_markup: { inline_keyboard: [[{ text: ctx.t("add-to-group"), url: link }]] } });
    }
});

bot.chatType(["group", "supergroup"])
    .command("flame", async (ctx: BotContext) => {
        const admins = await ctx.getChatAdministrators();
        const isAdmin = admins.some((admin) => admin.user.id === ctx.from?.id);
        if (!isAdmin) {
            return;
        }

        const group = await fetchGroup(ctx.chat?.id!);
        if (group.flameEnabled) {
            await stopFlameSession(ctx, group);
        } else {
            await startFlameSession(ctx, group);
        }
    });

// bot on join group
bot.on(":new_chat_members:me", async (ctx: BotContext) => {
    await ctx.reply(ctx.t("bot-joined"));
    await fetchGroup(ctx.chat?.id!);
});

bot.command("language", async (ctx: BotContext) => {
    await ctx.reply(ctx.t("language-choose"), { reply_markup: languageMenu });
});

bot.on("message", async (ctx: BotContext) => {
    const group = await fetchGroup(ctx.chat?.id!);
    if (group.flameEnabled) {
        const fromId = ctx.message?.from?.id;
        if (!fromId || fromId == ctx.me.id) return;
        group.flamers[fromId] = (group.flamers[fromId] || 0) + ctx.message?.text?.length!;
        await groups.replaceOne({ _id: ctx.chat?.id! }, group);
    }
});


const getPositionEmoji = (position: number): string => {
    return position <= 3 ? ["🥇", "🥈", "🥉"][position - 1] : "";
}

const getFlamerInfo = async (
    userId: number,
    ctx: BotContext,
    position: number,
    group: GroupData,
): Promise<string> => {
    const member = await ctx.getChatMember(userId);
    const firstName = member.user.first_name;

    const messageCount = group.flamers[userId];
    const formattedUser = `<a href="tg://user?id=${userId}">${firstName}</a>`;
    const positionEmoji = getPositionEmoji(position);

    const formattedMessage = ctx.t("top-flamers-layout", { rankemoji: positionEmoji, name: formattedUser, characters: messageCount });
    return formattedMessage;
};

async function startFlameSession(ctx: BotContext, group: GroupData) {
    group.flameEnabled = true;
    group.flameStartedAt = Date.now();

    // get the last pinned message
    const chat = await ctx.getChat();
    group.lastPinnedMessageId = chat.pinned_message?.message_id;

    const flavors = group.popcorns;
    const flavorList = Object.keys(flavors).map((type) => {
        const flavor = group.popcorns[type];
        return `${flavor.emoji} ${type}`;
    }).join("\n");

    await groups.replaceOne({ _id: ctx.chat?.id! }, group);

    const flameMessage = await ctx.reply(ctx.t("flame-started", { flavors: flavorList }), { reply_markup: popcornMenu });
    await ctx.pinChatMessage(flameMessage.message_id, { disable_notification: true });
}

const getFlamersMessage = async (ctx: BotContext, group: GroupData): Promise<string> => {
    const flamers = group.flamers;

    // check if all flamers have 0 messages
    if (Object.keys(flamers).length === 0) {
        return ctx.t("no-flamers");
    }

    const sortedFlamers = Object.keys(flamers).sort((a, b) => flamers[b] - flamers[a]);
    const topFlamers = sortedFlamers.slice(0, 3);
    const topFlamersMessages = await Promise.all(
        topFlamers.map(async (userId, index) => {
            return await getFlamerInfo(parseInt(userId), ctx, index + 1, group);
        }),
    );
    const topFlamersMessage = topFlamersMessages.join("\n");
    return topFlamersMessage;
}

const getFlavorsMessage = (ctx: BotContext, group: GroupData): string => {
    const flavors = group.popcorns;

    // check if all flavors have 0 takenTimes
    const allZero = Object.keys(flavors).every((type) => flavors[type].takenTimes === 0);
    if (allZero) {
        return ctx.t("no-flavors");
    }

    const sortedFlavors = Object.keys(flavors).sort((a, b) => flavors[b].takenTimes - flavors[a].takenTimes);
    const topFlavors = sortedFlavors.slice(0, 3);
    const topFlavorsMessages = topFlavors
        .filter((type) => {
            const flavor = group.popcorns[type];
            return flavor.takenTimes > 0;
        })
        .map((type) => {
            const flavor = group.popcorns[type];
            return `${flavor.emoji} (${type}) - ${flavor.takenTimes}`;
        });
    const topFlavorsMessage = topFlavorsMessages.join("\n");
    return topFlavorsMessage;
}

async function stopFlameSession(ctx: BotContext, group: GroupData) {
    group.flameEnabled = false;

    // unpin the flame message
    await ctx.unpinChatMessage(group.lastPinnedMessageId);

    const lastPinnedMessageId = group.lastPinnedMessageId;
    if (lastPinnedMessageId) {
        await ctx.pinChatMessage(lastPinnedMessageId, { disable_notification: true });
        group.lastPinnedMessageId = undefined;
    }

    const flameDuration = Date.now() - group.flameStartedAt!;
    const topFlamersMessage = await getFlamersMessage(ctx, group);
    const topFlavorsMessage = getFlavorsMessage(ctx, group);

    const hours = Math.floor(flameDuration / 1000 / 60 / 60);
    const minutes = Math.floor(flameDuration / 1000 / 60) % 60;
    const seconds = Math.floor(flameDuration / 1000) % 60;

    // reset flamers
    group.flamers = {};
    // reset popcorns
    for (const type in group.popcorns) {
        group.popcorns[type].takenTimes = 0;
        group.popcorns[type].takenBy = [];
    }
    // reset flameStartedAt
    group.flameStartedAt = undefined;

    await groups.replaceOne({ _id: ctx.chat?.id! }, group);

    await ctx.reply(ctx.t("flame-stopped", { topFlamers: topFlamersMessage, topFlavors: topFlavorsMessage, hours: hours, minutes: minutes, seconds: seconds }));
}

const runner = run(bot);

const stopRunner = () => runner.isRunning() && runner.stop();
Deno.addSignalListener("SIGINT", stopRunner);
Deno.addSignalListener("SIGTERM", stopRunner);
console.log("Bot started");
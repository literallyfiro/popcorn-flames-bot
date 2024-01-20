language-set = Language has been set to 🇺🇸 English
language-choose = 🇺🇸 Choose your language 🇺🇸
close = Close
back = Back

date-layout = 
    {$hours -> 
        *[0] {""}
         [one] 1 hour,{" "}
         [other] {$hours} hours,{" "}
    }{$minutes -> 
        *[0] {""}
         [one] 1 minute, and{" "}
         [other] {$minutes} minutes, and{" "}
    }{$seconds -> 
        *[0] 0 seconds.. what?
         [one] 1 second
         [other] {$seconds} seconds
    }

flame-started = 
    <b>🍿 FLAME STARTED? 🍿</b>

    As things get interesting, it's time to get comfortable and grab some popcorn!

    Use the <b>keyboard menu</b> to choose your flavor. The most popular flavors and the leaderboard of top flamers will be displayed at the end.

    <i>Available popcorn flavors:</i>
    {$flavors}

flame-stopped = 
    <b>🍿 FLAME ENDED? 🍿</b>

    The chaos is over, let's see <b>who flamed the most</b>:
    {$topFlamers}

    The most popular popcorn flavors were:
    {$topFlavors}

    The duration of the flame was <b>{date-layout}</b>

    <b>See you at the next heated argument!</b>

top-flamers-layout =
    {$rankemoji} {$name} with <b>{$characters -> 
        *[one] one character
         [other] {$characters} characters
    }</b>

pinning-not-allowed = ❌ You can't pin messages while the flame is going on! You can change settings with the <code>/settings</code> command.

no-flavors = ❌ <i>No flavors have been chosen :(</i>
no-flamers = ❌ <i>No flamers :(</i>

took-flavor = ✅ You have chosen the flavor <b>{$flavor}</b> for the popcorn in the group <b>{$group}</b>!
already-took-flavor = ❌ You have already chosen the popcorn flavor in the group <b>{$group}</b>! Only one flavor at a time!
took-flavor-announce = ✅ <b>{$name}</b> has chosen the flavor <b>{$flavor}</b> for their popcorns!
took-flavor-announce-anonymous = ✅ Someone has chosen the flavor <b>{$flavor}</b> for their popcorns!

# When the bot is added to a group
bot-joined =
    <b>🍿 FLAME BOT 🍿</b>

    Hi there! I'm the <b>Flame Bot</b>, and I'm ready to add some excitement to your group discussions. 🔥

    Admins, use the <b>/flame</b> command to kick off a flame and let the popcorn fest begin! 🎉

# Settings main menu message
settings =
    <b>⚙️ Settings</b>

    <b>announceWhenTakingPopcorn</b>:
     -> <i>When someone takes a popcorn flavor, announce it in the group.</i>

    <b>anonymousPopcorn</b>:
     -> <i>When someone takes a popcorn flavor, don't show their name.</i> <b>Requires announceWhenTakingPopcorn to be enabled.</b>
    
    <b>forceMessagePinning</b>:
     -> <i>Do not allow pinning while flame mode is on.</i>
language =
    <b>🇺🇸 Choose your language</b>

    Choose your language from the list below. The language will be applied to this group.
    Available languages are listed below.

# Private chat
start-private = 
    Hi there! 👋
    I'm the <b>Flame Bot</b>! 🍿✨

    Need some popcorn flavor for a private debate or discussion? Just add me to your group, and I'll spice things up for you. 🌶️

    Just use the <b>/flame</b> command in your group to start and stop the flame mode.
add-to-group = 🍿 Add me to your group 🍿


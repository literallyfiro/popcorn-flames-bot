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

no-flavors = ❌ <i>No flavors have been chosen :(</i>
no-flamers = ❌ <i>No flamers yet :(</i>

took-flavor = ✅ You have chosen the flavor <b>{$flavor}</b> for the popcorn in the group <b>{$group}</b>!
already-took-flavor = ❌ You have already chosen the popcorn flavor in the group <b>{$group}</b>! Only one flavor at a time!

# When the bot is added to a group
bot-joined =
    <b>🍿 FLAME BOT 🍿</b>

    Hi, I'm the <b>Flame Bot</b>! I'm here to help you choose the popcorn flavor for the next heated argument in your group.
    Admins can use the <b>/flame</b> command to start and stop the flame

# Private chat
start-private = 
    Hi.
add-to-group = 🍿 Add to your group 🍿


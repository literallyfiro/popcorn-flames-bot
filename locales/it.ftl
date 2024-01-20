language-set = La lingua è stata impostata su 🇮🇹 Italiano
language-choose = 🇮🇹 Scegli la lingua 🇮🇹
close = Chiudi
back = Indietro

date-layout = 
    {$hours -> 
        *[0] {""}
         [one] 1 ora,{" "}
         [other] {$hours} ore,{" "}
    }{$minutes -> 
        *[0] {""}
         [one] 1 minuto, e{" "}
         [other] {$minutes} minuti, e{" "}
    }{$seconds -> 
        *[0] 0 secondi.. eh?
         [one] 1 secondo
         [other] {$seconds} secondi
    }

flame-started = 
    <b>🍿 FLAME? 🍿</b>

    Qua le cose si fanno interessanti, è il caso di mettersi comodi e prendere dei popcorn!

    Usa il <b>menu nella tastiera</b> per scegliere che gusto vuoi, al termine appariranno i gusti più scelti assieme alla leaderboard dei migliori flamer.

    <i>Gusti di popcorn disponibili:</i>
    {$flavors}

flame-stopped = 
    <b>🍿 FLAME FINITO? 🍿</b>

    È finito il casino, vediamo <b>chi ha flammato di più</b>:
    {$topFlamers}

    I gusti di popcorn più scelti sono stati:
    {$topFlavors}

    La durata del flame è stata di <b>{date-layout}</b>

    <b>Ci vediamo al prossimo battibecco!</b>

top-flamers-layout =
    {$rankemoji} {$name} con <b>{$characters -> 
        *[one] un carattere
         [other] {$characters} caratteri
    }</b>

pinning-not-allowed = ❌ Non puoi fissare i messaggi mentre il flame è in corso! Puoi modificare le impostazioni con il comando <code>/settings</code>.

no-flavors = ❌ <i>Nessun gusto è stato scelto :(</i>
no-flamers = ❌ <i>Nessun flamer :(</i>

took-flavor = ✅ Hai scelto il gusto <b>{$flavor}</b> per i popcorn nel gruppo <b>{$group}</b>!
already-took-flavor = ❌ Hai già scelto il gusto dei popcorn nel gruppo <b>{$group}</b>! Solo un gusto alla volta!
took-flavor-announce = ✅ <b>{$name}</b> ha scelto il gusto <b>{$flavor}</b> per i suoi popcorn!
took-flavor-announce-anonymous = ✅ Qualcuno ha scelto il gusto <b>{$flavor}</b> per i suoi popcorn!

# Quando il bot viene aggiunto a un gruppo
bot-joined =
    <b>🍿 FLAME BOT 🍿</b>

    Ciao! Sono il <b>Flame Bot</b>, e sono pronto a portare un po' di eccitazione alle discussioni nel tuo gruppo. 🔥

    Amministratori, utilizzate il comando <b>/flame</b> per dare il via a un flame e iniziare la festa dei popcorn! 🎉

# Settings main menu message
settings =
    <b>⚙️ Impostazioni</b>

    <b>announceWhenTakingPopcorn</b>:
     -> <i>Quando qualcuno sceglie un gusto di popcorn, annuncialo nel gruppo.</i>

    <b>anonymousPopcorn</b>:
     -> <i>Quando qualcuno sceglie un gusto di popcorn, non mostrare il suo nome.</i> <b>Richiede che announceWhenTakingPopcorn sia abilitato.</b>
    
    <b>forceMessagePinning</b>:
     -> <i>Non consentire il fissaggio dei messaggi durante la modalità flame.</i>
language =
    <b>🇮🇹 Scegli la tua lingua</b>

    Scegli la tua lingua dall'elenco sottostante. La lingua verrà applicata a questo gruppo.
    Le lingue disponibili sono elencate di seguito.

# Chat privata
start-private = 
    Ciao! 👋
    Sono il <b>Flame Bot</b>! 🍿✨

    Hai bisogno di un gusto di popcorn per un dibattito o una discussione privata? Aggiungimi al tuo gruppo e io darò un po' di pepe alle cose. 🌶️

    Utilizza il comando <b>/flame</b> nel tuo gruppo per avviare e interrompere la modalità flame.
add-to-group = 🍿 Aggiungimi al tuo gruppo 🍿

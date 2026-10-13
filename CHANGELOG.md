# Fantasy Land changes

Fantasy Land started as a copy of the MongoDB port of [Adventure Land](https://github.com/kaansoral/adventureland_mongodb). These are the changes made since then, by version. Every code change is marked with a `// Single player:` comment so it's easy to find.

### v1
- Added `settings.txt`, one plain text file of game settings.
- **Shops:** a sell price multiplier for Gold Gabriel and the other NPC shops.
- **Ponty:** restocks every few minutes with random high grade gear. The item count, grade and upgrade levels are all settings.
- **Upgrading and compounding:** success chance settings.
- **HP and MP:** settings for how much HP you lose and how much MP attacks and skills cost.
- **Drops:** drop rate, gold rate and a "drop everything" setting.
- **Holiday events:** they can be switched on all year.
- **More characters:** a setting for how many can be online at once.
- **Character windows:** each character can open in its own window with `/window Name`, `open_character_window("Name")` in CODE, or the Deploy link.
- **One-click start and stop:**
  - `Play.bat` installs everything on the first run, then starts the database, website and game server in order and opens the game.
  - `Stop.bat` closes everything.
- **Online parts off:**
  - Payments and the shells shop, Steam sign-in and purchases, AI/MCP access, character transfers, reminder emails and referral pages are switched off.
  - The website and game server only accept connections from this PC.

### v2
- Fixed the game server refusing to start for 12 minutes after being closed without a clean shutdown. The game's keys are now made once and saved.
- Uses 127.0.0.1 instead of localhost.
- Hid the Steam and purchase links on the login page.

### v3
- **No sign-up:** the game logs you into one built-in account automatically.
- **Own window:** the game opens in a resizable window of its own.
- **Own database:** runs on port 27018, set up for the transactions the game needs to save accounts, characters and trades.
- `Stop.bat` closes the game window and shuts the database down cleanly.

### v4
- `Stop.bat` waits for characters to save before closing the game server.
- The row of event buttons can be collapsed.
- New settings:
  - `fishing_mining_cooldown`: no wait between fishing and mining.
  - `tools_break`: fishing rods and pickaxes never break.
  - `starting_gold`: new characters start with 10 million gold.
- Removed the email help line from the login screen.

### v5
- The browser always loads the newest game scripts after a restart, so an update never runs old cached code.
- **Merrit:**
  - `merrit_visit_minutes` sets how often he visits, with a separate timer for each merchant.
  - No settle wait after a stall opens.
  - He brings a parcel on every visit.
  - With `merrit_buys_stall`, he buys everything on each merchant's stall at the listed price. You get the gold and the items leave the stall. Nothing in your bag is touched.

### v6
- Renamed the game to Venture Land.
- Added a credits box to the character select screen.
- Removed server selection.

### v7
- Renamed the zip and folder.
- The game folder can be renamed or moved without breaking anything, because `Play.bat` remakes the config link on every start.

### v8
- Renamed the game to **Fantasy Land - The Code (NOMMO) RPG**.
- Merchants earn XP from Merrit's buyouts.
- Added a **Holiday Events** menu, opened by the candy cane button above the skill bar. Events switch on and off while you play.

### v9
- Removed Email/Account and Share/Recruit, along with their behind-the-scenes calls.
- Reordered the character select screen to credits, then the menu, then In Game.
- Removed the Discord links and the Steam news banner.
- Wrote single-player Terms of Service and a Privacy Policy.
- Restored the original Thanks and Attributions page.

### v10
- Every event monster has its own on/off switch, in `settings.txt` and in the Holiday Events menu.
- Removed:
  - the email note in Settings
  - the Docs and Hub buttons and pages
  - the Upcoming panel
  - the "Game dynamics and drops aren't final" note
- The Thanks page now thanks Adventure Land, Kaan Soral, the developers and the artists.

### v11
- "Adventure Land" now reads "Fantasy Land" in the game's text, in every language. The Thanks page keeps the original name.
- The Wizard has a new line, in every language: "I don't know who made this land, but it's fantastic!"
- Removed the "email hello@adventure.land" help line from the loading screen, in every language.
- The chat header shows only the map name.

### v12
- Removed the update script. The game never updates itself.
- Changed the Privacy Policy to say the game never goes online by itself.

### v13
- The tutorial comic and the Cave of Many Dreams comic show "Fantasy Land", in every language.
- **New starting looks:** 10 in all, 5 male and 5 female, each with a second skin tone. They show as extra look buttons (E to H) on the character creation screen when a class has them.
  - Male: Ironclad Veteran (warrior), Ashen Hood (rogue), Ember Sage (mage), Sunforged Templar (paladin) and Trailwise Trader (merchant).
  - Female: Frost Shieldmaiden (warrior), Greenwood Warden (ranger), Silver Oracle (priest), Tidecaller Witch (mage) and Crimson Knife (rogue).
- **Title screen:** the game now opens on a Fantasy Land title screen with a Login button that goes on to character select. A note in the corner reads "A derivative of Adventure Land, with thanks to Kaan Soral".
- **Character select:** no seasonal event or update notices. The log says "Welcome to Fantasy Land!" with a few tips, instead of the server name and update notes.
- **In Game list:** character select lists up to 8 characters, then a 1st and 2nd merchant.
- `Stop.bat` also stops a game started by Fantasy Land.exe.
- **Logout:** the settings window has a Logout button in its top left, matching Close, that goes back to the title screen.
- **Fantasy Land.exe:** has the title screen picture as its icon. It starts the game with no console windows. When you close the last game window, it saves and stops everything, then closes itself.
- Rewrote this README.

### v14
- The title screen's Login button is half the size.
- The "A derivative of Adventure Land" note moved to the bottom left, so the log box no longer covers it.
- The log says "Click Login to get started." under the welcome while the title screen is showing.
- Character select shows "Fantasy Land - The Code (NOMMO) RPG" where it used to show "Server: Americas I".

### v15
- **Mod Menu:** a new button at the bottom of the screen, left of the game log, opens a window with every setting. Changes apply straight away and are saved to `settings.txt`.
- **God Mode** (`god_mode`): your characters take no damage, from monsters, burns, traps or anything else.
- **Fire Sale** (`fire_sale`): everything in the NPC shops, Ponty and Lost and Found costs nothing.
- **Daisy's tokens** (`monster_hunt_tokens`): how many monster tokens Daisy gives for each finished monster hunt. Default 1.
- **Drop luck and gold are multipliers now:** `drop_rate` and `gold_drop`, where 1 = normal and 2 = double. They replace `drop_rate_percent` and `gold_drop_percent`. An older `settings.txt` is converted on the next start, so 200 becomes 2.
- `starting_gold` changes count for the next new character without a restart.
- Items you sell to an NPC are gone. Ponty no longer stocks them and only sells his own restocked gear. The `ponty_keep_sold_items` setting is removed, and an older `settings.txt` drops it on the next start.
- **Character select:** the menu box with Character Ops and Logout is gone. Character Ops now sits at the top of the In Game box. To log out, use the Logout button in the settings window.
- **Events page:** the Info button on character select opens a rewritten Events page about how events work in Fantasy Land: holidays and event monsters you switch on yourself, the daily and nightly events, and links to each event's guide. The home server and realm parts are gone. It's translated into every language the game supports (text in `singleplayer/events_page`).
- **Game window:** the icon is the Fantasy Land title screen picture instead of the Adventure Land logo, and the window title always reads "Fantasy Land - The Code (NOMMO) RPG" instead of the character's name.
- **Goo comic:** the "Fantasy Land" title now also shows when the comic opens from the tutorial in game. Before, it only showed on the website version.

### v16
- **Holiday events moved into the Mod Menu:** the holiday and event monster switches are at the bottom of the Mod Menu. The candy cane button and the separate Holiday Events menu are gone.
- **Comic page 2:** the speech bubble now says "We built Fantasy Land inside their machines.", in every language.
- The Events page says to switch holidays in the Mod Menu, in every language.

### v17
- Character select no longer shows a server tag ("US I") in the corner of each character, or the home server popup when you hover over one.

### v18
- New Mod Menu setting, **XP multiplier** (`xp_rate`): 1 = normal XP from monsters, 2 = double, and so on.
- Upgrade and compound chance are now multipliers like drop luck (**Upgrade luck** and **Compound luck**, `upgrade_success` and `compound_success`): 1 = normal, 2 = twice the chance of success. An older `settings.txt` is converted automatically (`upgrade_success_percent = 200` becomes `upgrade_success = 2`).
- **Characters online** in the Mod Menu now really sets how many characters can play at once. Before, the game could still stop a 5th character with "You can have 3 characters and one merchant online at most". Merchants now count like any other character, and the message, when you do reach the limit, says how many your setting allows.
- README: a note on the risks of running a lot of game windows at once, and clearer update steps: what to back up (`singleplayer\data` and `settings.txt`) and how to move to a new folder.

### v19
- Every character slot is free, up to the game's limit of 18 characters. Creating more characters no longer asks for 200 shells or says your account has no free slots.
- Up to 2 merchants can be online at once (part of Characters online). A 3rd merchant is turned away with a message that says why.
- The game server waits up to 60 seconds, instead of 12, before giving up on a window that's busy (for example while another window loads), and no longer closes character select and loading windows when more than 5 are open at once.
- New starting looks E to H for every class, as a male and a female in light and dark skin: barbarian warriors, paladins in blue plate, a pope and a nun for priests, a wizard and a witch for mages, ninja rogues, Robin Hood rangers in green caps, and banker merchants. The game's own looks stay on A to D. The looks added in earlier versions are removed; characters already made with them keep their look.
- Game windows keep running at full speed when they're in the background or minimised. Edge normally slows hidden windows down, which slowed your characters' CODE.
- Each game window's title is the character's name, then the game's name, for example "Chillyinit: Fantasy Land - The Code (NOMMO) RPG". Character select still shows just the game's name.

### v20
- **Fixed:** going over 3 fighters or 1 merchant online disconnected every fighter (or every merchant) a few seconds later. A leftover rule from the online game's website checked every few seconds for 3 characters and 1 merchant per player, and kicked all of them. It's off in single player, so Characters online and the 2 merchant limit are the only limits.
- Each game window opened from the game (Deploy, `/window` or `open_character_window`) now runs in its own browser process, so a window that's loading doesn't hold up the others.
- **Older characters get the new looks.** Characters made with the E to H looks from before v19 now wear the current look for the same letter. It happens by itself the first time the game starts, and any other cosmetics they have stay on. The old and new sets aren't in the same order, so some characters switch between a male and a female look: old F and G warriors, rogues and mages, F paladins and merchants, and E rangers and priests.
- **Shells are gone; seashells replace them.** Shells no longer drop from monsters, exchanges or Merrit's visits, and they're hidden from the inventory, item prices, bank tellers and the guides. Everything that cost Shells now takes **seashells** from your bag, at 625 seashells for every 75 Shells, rounded up:
  - **Favoré's server blessing:** 10,000 seashells (3 days of +25% XP, +20% gold, +5 luck).
  - **Mr. Dworf's cosmetic boxes** (traded at Haila for a random look): Hairdo 1,075, Armor 2,409, Hat 3,325, Make-up 3,825, Misc 10,825, Accessory 11,659. Fire Sale still makes them free.
  - **Renaming a character** (Character Ops), paid from that character's bag: 5,334 for 5 or more letters, 20,000 for 4, 200,000 for 3, 400,000 for 2, 1,333,334 for 1.
  - **Bank packs:** 5,000 to 15,417 seashells, or gold as before.
  - Old Paper Money now exchanges at Xyn for 6,667 seashells instead of 800 Shells.
  - Transferring a character to another account is gone from Character Ops.
- **Guides cleaned up for single player.** Removed the Hub & Chat, MCP for AI, Mainframe, JSON API, PvP & Duels and MessagePack guides, and the online game's Servers, Limits, Rules page. A new **Characters & Limits** guide covers characters online, the 2 merchant limit, the 18 free slots and running many windows. Lines that talked about other players, linked accounts, PvP or Mainframe were rewritten across the guides and tutorials: markets and merchant lessons now describe selling to Merrit, Multiple Characters lists `/window` and `open_character_window`, and the poker blinds table shows only your table. The About panel on the start page describes the single player game. The Mainframe tab in COM and the `/mainframe` page are gone. Rewritten lines are in English for now; other languages show the English text for them.

### v21
- Mr. Dworf's Armor box costs 2,410 seashells (was 2,409).
- Renaming to a short name costs less, so every length can be bought: 10,000 seashells for 4 letters, 50,000 for 3, 150,000 for 2 and 350,000 for 1. A 1-letter name needs about 36 full stacks of seashells in that character's bag (a bag holds 42 stacks of 9,999). Names of 5 letters or more still cost 5,334.

### v22
- New Mod Menu setting, **Damage multiplier** (`damage_rate`): the damage your characters deal to monsters. 1 = normal, 2 = every hit does double damage, 0.5 = half. Hits still roll as usual, then the multiplier applies.
- **HP loss** and **MP usage** are multipliers now, like the others (`hp_loss` and `mp_usage`): 1 = normal, 0.5 = half, 0 = none. An older `settings.txt` is converted automatically (`hp_loss_percent = 50` becomes `hp_loss = 0.5`).
- New Mod Menu setting, **Respawn time** (`monster_respawn`): how long killed monsters take to come back, bosses and event monsters included. 1 = normal, 0.5 = twice as fast, 0 = straight away. Changing it also speeds up respawns that are already waiting.
- New Mod Menu setting, **Death penalty** (`death_penalty`): the XP a character loses on death. 1 = normal, 0.5 = half, 0 = none.
- New Mod Menu setting, **Run speed** (`run_speed`): 1 = normal, 2 = double, up to 5.
- New Mod Menu setting, **Safe upgrades** (`safe_upgrades`): a failed upgrade keeps the item at its old level, and a failed compound keeps all three items. The scroll is still used.
- New Mod Menu setting, **Skill cooldowns** (`skill_cooldown`): the wait before a skill can be used again. 1 = normal, 0.5 = half the wait, 0 = no wait. Monster skills aren't changed.
- New Mod Menu button, **Give Gold** (Characters): type an amount and press **Send Gold** to add it to every character online. The amount stays in the box (and in `settings.txt` as `give_gold`), so you can press Send again as often as you like.
- New Mod Menu setting, **Exchange luck** (`exchange_luck`, in Loot): every exchange in the game (Xyn, boxes, gems, quest items, class rewards), fishing, mining and the chests monsters drop. 1 = normal, 2 = every reward rarer than the table's most common one is twice as likely, and bonus rewards are twice as likely too.
- New Mod Menu setting, **Trader Discount %** (`trader_discount`, in Market): percent off the gold price of everything in the NPC shops, Ponty and Lost and Found. 0 = normal, 100 = free. Seashell prices aren't changed.
- **Sell price** is now called **Sell Item Price** in the Mod Menu: what NPCs pay for your items, 1 = normal, 2 = double.
- **The Mod Menu is grouped:** it opens on a page of groups (Combat, Monsters, Loot, Crafting & Gathering, Market, Characters and Holiday Events), each showing how many of its settings you've changed. Click a group to open its page, and Back to return.
- **New Win + button:** a small **Win +** button sits on top of the Mod Menu icon, styled like the Close button and exactly as wide as the icon. Click it to open a new game window on the character select page, the same as `/new_window`, so you don't have to type anything for each new window.
- **Hidden files:** the game's own files, including `steam_news.js`, `steam_signin.js` and `steam_signup.js`, are hidden in the game folder, so it only shows what you use. They're hidden in the zip and again every time the game starts, from the list in `singleplayer\hidden.txt`. Turn on Hidden items in File Explorer to see them.
- **Smaller download:** the zip no longer includes developer files: the `.git` folders, the Steam desktop client's source (`tauri`), tests and notes. None of them are used when the game runs. `scripts\make_player_zip.py` makes the zip.
- **New looks for the town's NPCs:** 23 NPCs have been redesigned to suit what they do. Seven have their own new sprites: Cue the enchantress, Xyn hovering on blue orbs, Gabriel with a scythe, Leo, Pete, Tricksy and Ponty at his market stall. The other sixteen wear new character outfits: Lucas, Rose, Tristian, Ernis, Garwyn, Alia, Divian, Haila, Mr. Dworf, Fvona, Bean, Gn. Spence, Daisy, Cole, Favoré and Dorr.
- **New monster sprites:** 136 monsters and creatures have been redrawn, from the Goo and Rat up to the Croc and Dragold. Each has a sheet of its own in `images/singleplayer/monsters`. Frames that changed size (the fairies, kitties, Snowman, Fire Vampire, Croc and Dragold) are cropped to fit the new art. The Cave's travellers, Dark Mage, Cave Guard and Moth Keeper have new bodies too; the matching clothes players can wear are unchanged. Two town NPCs share a monster look and now wear the new one: the Locksmith (Soldier) and the Lost & Found goblin.
- **Collapsible tools row:** the buttons at the top right (X, CODE, COM, SKILLS, GUIDE, TRAVEL, CONF) have a **HIDE** button on their left, like the events strip. Click it to collapse the row to a single **TOOLS** button, and click again to bring it back. Your choice is remembered.
- **Login button:** the Login button on the title screen sits lower, with a gap below the title.
- **Sprites match everywhere:** the NPC pictures in the item info (like Exchangeable), shop, party and dialog windows now show each NPC the way it looks in the world, with its own hat, hair and face. The taller NPC sprites (Xyn, Cue, Gabriel, Leo, Pete, Tricksy and Ponty) are no longer cut off.

# Fantasy Land - The Code (NOMMO) RPG

Fantasy Land is a single-player version of Adventure Land, the MMORPG you can play by writing code. It runs entirely on your own Windows PC. There are no other players, no account to sign up for, and nothing to buy. You can play several characters at once, and one settings file lets you tune the game to suit you.

It's built on the MongoDB port of [Adventure Land](https://github.com/kaansoral/adventureland_mongodb) by Kaan Soral and the Adventure Land developers. All credit for the original game goes to them. See the Thanks page in the game.

## What you need to install

Install these once:

1. **Node.js** (the LTS version) from https://nodejs.org. Keep the default options. It runs the game's website and game server.
2. **MongoDB Community Server** from https://www.mongodb.com/try/download/community. Choose "Complete" and keep the default options. MongoDB Compass is optional. This is the database that saves your characters, items and settings.
3. **Microsoft Edge.** It comes with Windows, and the game opens in its own Edge window.

Git isn't needed, because the shared engine already comes in the game folder.

## Playing

1. Extract the zip somewhere, for example `C:\FantasyLand`.
2. Double-click **`Fantasy Land.exe`**.

A small window shows the progress while it starts the database, the website and the game server, with no console windows. Then the game opens in its own window. It opens on the title screen: press Login (or Enter) to go to character select. The very first start also installs the game's packages and loads the maps, so it takes a few minutes. After that it's quick.

On character select, click a Free Slot (or New) to create a character, then click a character to play. Every class has 4 extra starting looks, Opt. E to H. The Logout button at the top left of the Settings window takes you back to the title screen.

You're logged in automatically. Everything stays on your PC, and only your PC can connect to the game.

The first time you run `Fantasy Land.exe`, Windows may show "Windows protected your PC", because the file isn't digitally signed. Click "More info", then "Run anyway". Windows only asks once.

## Stopping

Just close the game window. Fantasy Land.exe shows "Saving your characters..." while it waits for your characters to save and stops everything, then closes by itself. If you have several character windows open, it waits until you close the last one.

Don't end the game's processes in Task Manager, so your characters get a chance to save.

## Play.bat and Stop.bat

These do the same job as `Fantasy Land.exe` with console windows you can see, which helps when something goes wrong:

- **`Play.bat`** starts everything in order and opens the game.
- **`Stop.bat`** closes the game window, waits a few seconds so your characters save, then stops the game server, the website and the database. Always use it rather than just closing the console windows, so the database shuts down cleanly.

When the game is started with `Fantasy Land.exe`, the database, website and game server write their messages to the `logs` folder instead.

## Settings

The easiest way is the **Mod Menu**: the computer button at the bottom of the screen, left of the game log. It lists every setting, changes apply as soon as you set them, and your choices are saved to `settings.txt`. Type a number and press Enter, or click ON/OFF. Two settings, Merrit's visit minutes and the fishing and mining wait, only take effect after a restart.

You can also open `settings.txt` in the game folder with Notepad. Every setting is explained inside it. Save the file, then close the game and start it again for the change to take effect. You can change:

- God Mode: your characters take no damage
- Fire Sale: everything in the NPC shops, Ponty and Lost and Found is free
- how many monster tokens Daisy gives for a finished monster hunt
- shop sell prices
- Ponty's restock and what he sells
- upgrade and compound luck, as multipliers (1 = normal, 2 = twice the chance of success)
- XP from monsters and the damage your characters deal, as multipliers (1 = normal, 2 = double)
- HP loss and MP usage, as multipliers (1 = normal, 0.5 = half, 0 = none)
- drop luck and gold, as multipliers (1 = normal, 2 = double)
- holiday events and event monsters
- how many characters can be online at once
- fishing and mining wait times, and whether tools break
- starting gold
- Merrit's market visits

If `settings.txt` is deleted, a fresh one is made on the next start. New settings from a newer version are added to the end of your file automatically, and your own values are kept.

Holiday events and event monsters are switched in the Mod Menu too.

## Playing several characters at once

Each of these opens a character in its own window:

- **Characters list:** open the Characters tab and click **Deploy** next to an offline character.
- **Chat:** type `/window CharacterName`. `/window` on its own opens the character select page.
- **CODE:** call `open_character_window("CharacterName")`.

**Characters online** in the Mod Menu (`max_characters_online` in `settings.txt`) sets how many can be online together, merchants included, up to 18. Up to 2 of them can be merchants at the same time. Opening a 3rd merchant, or one character more than Characters online allows, is turned away, and a message in that window's log says why.

All 18 character slots are free, so there are no slots to buy.

**Running a lot of windows.** Every character runs in its own game window, and each window uses roughly as much memory and processor time as a browser tab running a game. The game doesn't stop you at a hardware limit, so the more windows you open the more your PC has to do. Things to watch for:

- The game, and your PC, slowing down or stuttering, most noticeably while many characters fight at once.
- Windows running out of memory: windows can freeze or close, and other programs slow down.
- On a laptop, more heat, fan noise and battery drain.

If things get slow, close a window or two. Your characters are saved on the server as you play, so closing a window doesn't lose progress.

## Updating to a new version

The game never updates itself. A new version comes as a new zip.

Your game is kept in two places, and these are all you need to carry over:

- `singleplayer\data`: the database. Your account, characters, items, bank and the scripts you saved in the game's CODE window are all in here.
- `settings.txt` in the game folder: your settings, including everything you set in the Mod Menu.

**Back them up first.** Close the game (or run `Stop.bat`) and copy both somewhere safe. Always copy them with the game closed, or the database copy may be incomplete.

**Updating in place (easiest):**

1. Close the game (or run `Stop.bat`).
2. Extract the new zip over your game folder, replacing files when asked.
3. Start with `Fantasy Land.exe`.

Your `settings.txt` and saved game are kept, since the zip contains neither. Extracting over the folder doesn't delete files that a newer version no longer uses, which is harmless.

**Updating into a new folder:**

1. Close the game (or run `Stop.bat`).
2. Extract the new zip to its own folder.
3. Copy the `singleplayer\data` folder from the old folder into the new folder's `singleplayer` folder.
4. Copy `settings.txt` from the old folder into the new folder.
5. Start the new folder's `Fantasy Land.exe`. Once you're happy everything is there, the old folder can be deleted.

New settings added by a newer version are written to the end of your `settings.txt` automatically, and your own values are kept.

## Where things are

- `Fantasy Land.exe`: starts the game, and stops it when you close the game window. Its source is in `singleplayer\launcher`.
- `Play.bat` and `Stop.bat`: start and stop the game with console windows.
- `logs\`: messages from the database, website and game server when started by `Fantasy Land.exe`.
- `CHANGELOG.md`: the changes below, on their own.
- `settings.txt`: your settings. `settings.example.txt` holds the defaults.
- `singleplayer\data`: your saved game (the database). Back this folder up to keep your characters safe, with the game stopped.
- `singleplayer\`: the single-player config, launch helpers and text changes.
- `node\logic\single_player.js`: reads `settings.txt` and applies it to the game.

The game's own database runs on port 27018, separate from any other MongoDB on your PC. The website uses port 8090 and the game server uses port 7192.

## Changes from the original game

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
- The Mod Menu's Experience section is now **Experience and Combat**, with XP, damage, HP loss and MP usage together.

## License

[AdventureLandOnlyUse](LICENSE) — free for commercial use with attribution. See the license file for full terms.

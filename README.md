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

On character select, click a Free Slot (or New) to create a character, then click a character to play. There are extra starting looks (Opt. E to H) for some classes. The Logout button at the top left of the Settings window takes you back to the title screen.

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
- upgrade and compound luck
- HP loss and MP usage
- drop luck and gold, as multipliers (1 = normal, 2 = double)
- holiday events and event monsters
- how many characters can be online at once
- fishing and mining wait times, and whether tools break
- starting gold
- Merrit's market visits

If `settings.txt` is deleted, a fresh one is made on the next start. New settings from a newer version are added to the end of your file automatically, and your own values are kept.

Holiday events can also be switched while you play. The candy cane button above the skill bar opens the Holiday Events menu.

## Playing several characters at once

Each of these opens a character in its own window:

- **Characters list:** open the Characters tab and click **Deploy** next to an offline character.
- **Chat:** type `/window CharacterName`. `/window` on its own opens the character select page.
- **CODE:** call `open_character_window("CharacterName")`.

`max_characters_online` in `settings.txt` sets how many can be online together.

## Updating to a new version

The game never updates itself. A new version comes as a new zip:

1. Close the game (or run `Stop.bat`).
2. Extract the new zip over your game folder.
3. Start with `Fantasy Land.exe`.

Your `settings.txt` and saved characters are kept. Extracting over the folder doesn't delete files that a newer version no longer uses, which is harmless.

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
- **Goo comic:** the "Fantasy Land" title now also shows when the comic opens from the tutorial in game. Before, it only showed on the website version.

## License

[AdventureLandOnlyUse](LICENSE) — free for commercial use with attribution. See the license file for full terms.

# Fantasy Land: single player Adventure Land on Windows

Fantasy Land is a single player copy of [Adventure Land](https://adventure.land) that runs entirely on your own PC. It adds one settings file (`settings.txt`) that controls shop prices, Ponty's stock, upgrade and compound luck, HP and MP usage, drop rates, holiday events, fishing and mining, starting gold, Merrit's market visits and how many characters you can play at once.

## Install once

1. Install **Node.js LTS** from https://nodejs.org (keep the default options).
2. Install **Git** from https://git-scm.com/download/win (keep the default options).
3. Install **MongoDB Community Server** from https://www.mongodb.com/try/download/community (choose "Complete"; MongoDB Compass is optional).
4. Get this folder onto your PC, for example in `C:\FantasyLand`:
   ```
   git clone <your fork's URL> C:\FantasyLand
   ```

## Playing

Double-click **`Play.bat`**. It starts the database, then the website, then the game server, waiting for each one to be ready before starting the next, and then opens the game in its own resizable window. The first run also installs everything and loads the maps, so it takes a few minutes.

There's no sign-up: you're logged into one built-in account automatically. Everything stays on your PC, and only your PC can connect.

To stop everything, including the game window, double-click **`Stop.bat`**.

The game keeps its own database in `singleplayer\data` on port 27018, separate from any other MongoDB on your PC. It runs as a one-member replica set because the game saves accounts, characters and trades with database transactions.

## Playing several characters at once

Each of these opens a character in its own game window:

- **Characters list:** open the Characters tab in game and click **Deploy** next to an offline character.
- **Chat command:** type `/window CharacterName` in chat. `/window` on its own opens the character select page.
- **CODE:** call `open_character_window("CharacterName")` from your code.

If nothing opens, your browser blocked the pop-up. Click the blocked pop-up icon in the address bar and allow pop-ups for `localhost`.

`max_characters_online` in `settings.txt` sets how many characters can be online together (the normal game allows 3).

## Settings

Open `settings.txt` (in the main folder) with Notepad. Every line is explained inside it. After saving, run `Stop.bat` and then `Play.bat`.

If `settings.txt` is ever deleted, a fresh one is copied from `settings.example.txt` on the next start. When an update adds new settings, they are added to the end of your `settings.txt` on the next start, and your own values are kept.

`starting_gold` only applies to characters created after you change it.

The row of event buttons at the top right has a show/hide button on its left. The candy cane button above the skill bar turns holiday events on and off while you play.

## Updating to the newest official version

Run `Stop.bat`, then double-click `singleplayer\update_game.bat`. It pulls the latest official game code into your copy and keeps the single player changes and your `settings.txt`.

The single player changes are kept small on purpose, so updates almost always merge on their own. If the official update touched the same lines, the script stops and tells you; nothing is changed until that's sorted out.

## What was changed

All changes are marked with a `// Single player:` comment so they're easy to find.

| Feature | Where |
|---|---|
| Settings file reader | `node/logic/single_player.js` |
| Sell price multiplier | `sell` handler in `node/server.js` |
| Ponty restock | `single_player_ponty_restock` in `node/server.js` |
| Upgrade and compound chance | `upgrade` and `compound` handlers in `node/server.js` |
| HP loss | main damage line and burn damage in `node/server.js` |
| MP usage | `consume_mp` in `node/server_functions.js` |
| Drops and gold | `roll_monster_drops` and `drop_something` in `node/server.js` |
| Holiday events, character limit | top of `node/server.js` |
| New windows | `open_character_window` in `js/functions.js`, `js/runner_functions.js`, `js/html.js` |
| Config for a local PC | `singleplayer/config/` |
| Payments, Steam sign-in and purchases, AI/MCP access, referrals switched off | `singleplayer/web.js`, hooked in `main.js` |
| Website and game server only reachable from this PC | `singleplayer/config/options.js` |

## What was switched off

This is a single player game with multiple characters, so these parts are switched off: Stripe and Steam payments and the shells shop, Steam sign-in, AI/MCP remote access, moving characters to other accounts, password reminder emails, referral links and the search engine sitemap. The website and game server also only accept connections from your own PC, so nobody else can join.

They are switched off rather than deleted, which keeps official updates merging cleanly.

## License

Adventure Land's code is under the AdventureLandOnlyUse license (see `LICENSE`). Personal use and changes are fine. Don't sell the code, and credit https://adventure.land if you ever publish anything built on it.

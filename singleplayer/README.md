# Adventure Land: single player on Windows

This copy of [Adventure Land](https://adventure.land) runs entirely on your own PC. It adds one settings file (`settings.txt`) that controls shop prices, Ponty's stock, upgrade and compound luck, HP and MP usage, drop rates, holiday events and how many characters you can play at once.

## One-time setup

1. Install **Node.js LTS** from https://nodejs.org (keep the default options).
2. Install **Git** from https://git-scm.com/download/win (keep the default options).
3. Install **MongoDB Community Server** from https://www.mongodb.com/try/download/community. Choose "Complete" and leave "Install MongoD as a Service" ticked, so the database starts with Windows. MongoDB Compass is optional.
4. Get this folder onto your PC, for example in `C:\AdventureLand`:
   ```
   git clone <your fork's URL> C:\AdventureLand
   ```
5. Double-click `singleplayer\setup.bat`. It downloads the shared engine, installs packages, links the config and loads the maps into the database.

## Playing

Double-click `singleplayer\start_game.bat`. Two black windows open (the website and the game server). Leave them open while you play. Your browser then opens http://localhost:8090. Sign up with any email and password; it all stays on your PC.

To stop the game, close the two black windows.

## Playing several characters at once

Each of these opens a character in its own game window:

- **Characters list:** open the Characters tab in game and click **Deploy** next to an offline character.
- **Chat command:** type `/window CharacterName` in chat. `/window` on its own opens the character select page.
- **CODE:** call `open_character_window("CharacterName")` from your code.

If nothing opens, your browser blocked the pop-up. Click the blocked pop-up icon in the address bar and allow pop-ups for `localhost`.

`max_characters_online` in `settings.txt` sets how many characters can be online together (the normal game allows 3).

## Settings

Open `settings.txt` (in the main folder) with Notepad. Every line is explained inside it. After saving, close both black windows and run `start_game.bat` again.

If `settings.txt` is ever deleted, a fresh one is copied from `settings.example.txt` on the next start.

## Updating to the newest official version

Close both server windows, then double-click `singleplayer\update_game.bat`. It pulls the latest official game code into your copy and keeps the single player changes and your `settings.txt`.

The single player changes are kept small on purpose, so updates almost always merge on their own. If the official update touched the same lines, the script stops and tells you; nothing is changed until that's sorted out.

## What was changed

All changes are marked with a `// Single player:` comment so they're easy to find.

| Feature | Where |
|---|---|
| Settings file reader | `node/logic/single_player.js` |
| Shop prices | `buy` handler in `node/server.js` |
| Ponty restock | `single_player_ponty_restock` in `node/server.js` |
| Upgrade and compound chance | `upgrade` and `compound` handlers in `node/server.js` |
| HP loss | main damage line and burn damage in `node/server.js` |
| MP usage | `consume_mp` in `node/server_functions.js` |
| Drops and gold | `roll_monster_drops` and `drop_something` in `node/server.js` |
| Holiday events, character limit | top of `node/server.js` |
| New windows | `open_character_window` in `js/functions.js`, `js/runner_functions.js`, `js/html.js` |
| Config for a local PC | `singleplayer/config/` |

## License

Adventure Land's code is under the AdventureLandOnlyUse license (see `LICENSE`). Personal use and changes are fine. Don't sell the code, and credit https://adventure.land if you ever publish anything built on it.

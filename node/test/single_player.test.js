const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const single_player = require("../logic/single_player");

test("settings.txt parsing accepts comments, percent signs, yes/no and ignores bad lines", () => {
	const values = single_player.parse(
		"# note\ndrop_rate_percent = 50%\r\ndrop_everything = yes # inline note\nhp_loss_percent = lots\nunknown = 3\nno equals sign\n",
	);
	assert.deepEqual(values, { drop_rate: 0.5, drop_everything: true });
});

test("the old percent drop and gold settings still work, and the new names win", () => {
	assert.deepEqual(single_player.parse("drop_rate_percent = 300\ngold_drop_percent = 50\n"), { drop_rate: 3, gold_drop: 0.5 });
	assert.deepEqual(single_player.parse("drop_rate = 2\ndrop_rate_percent = 300\n"), { drop_rate: 2 });
	assert.equal(
		single_player.rename_settings(
			"# Gold dropped by monsters. 100 = normal.\r\ngold_drop_percent = 250%  # mine\r\ndrop_rate_percent=100\r\n",
		),
		"# Gold dropped by monsters. A multiplier: 1 = normal, 2 = double.\r\ngold_drop = 2.5  # mine\r\ndrop_rate=1\r\n",
	);
});

test("removed settings are skipped quietly and taken out of settings.txt", () => {
	assert.deepEqual(single_player.parse("ponty_keep_sold_items = yes\n"), {});
	assert.equal(
		single_player.rename_settings("a = 1\r\n\r\n# Keep?\r\nponty_keep_sold_items = no\r\n\r\n# x\r\nb = 2\r\n"),
		"a = 1\r\n\r\n# x\r\nb = 2\r\n",
	);
});

test("God Mode, Fire Sale and Daisy's tokens have settings, and the Mod Menu checks values", () => {
	const sp = single_player.create({ hp_loss: 0.5, drop_rate: 2, gold_drop: 3 });
	assert.equal(sp.scale("hp_loss", 100), 50);
	assert.equal(sp.scale("drop", 0.1), 0.2);
	assert.equal(sp.scale("gold", 10), 30);
	sp.settings.god_mode = true;
	assert.equal(sp.scale("hp_loss", 100), 0);
	assert.equal(single_player.DEFAULTS.monster_hunt_tokens, 1);
	assert.equal(single_player.DEFAULTS.fire_sale, false);
	assert.equal(single_player.check_value("fire_sale", true), true);
	assert.equal(single_player.check_value("fire_sale", "yes"), undefined);
	assert.equal(single_player.check_value("drop_rate", "1.5"), 1.5);
	assert.equal(single_player.check_value("monster_hunt_tokens", "2.6"), 3);
	assert.equal(single_player.check_value("monster_hunt_tokens", "-1"), undefined);
	assert.equal(single_player.check_value("monster_hunt_tokens", ""), undefined);
	assert.equal(single_player.check_value("nothing", 1), undefined);
	const keys = sp
		.mod_state()
		.groups.flatMap((group) => group.rows)
		.filter((row) => row.key)
		.map((row) => row.key);
	// Every setting is in the Mod Menu, holiday events and event monsters included
	assert.deepEqual(Object.keys(single_player.DEFAULTS).filter((key) => !keys.includes(key)), []);
	assert.equal(sp.holiday_event("holiday_season"), "holidayseason");
	assert.equal(sp.holiday_event("monster_grinch"), "grinch");
	assert.equal(sp.holiday_event("monster_hunt_tokens"), undefined);
	assert.equal(sp.holiday_event("god_mode"), undefined);
});

test("the character limit can go down again while playing", () => {
	const sp = single_player.create({ max_characters_online: 10 });
	const options = { character_limit: 3, ip_limit: 3 };
	sp.apply_options(options);
	assert.equal(options.character_limit, 10);
	sp.settings.max_characters_online = 5;
	sp.apply_options(options);
	assert.deepEqual(options, { character_limit: 5, ip_limit: 5 });
});

test("every setting in settings.example.txt is known and parses", () => {
	const text = fs.readFileSync(path.resolve(__dirname, "../../settings.example.txt"), "utf8");
	const values = single_player.parse(text);
	assert.deepEqual(Object.keys(values).sort(), Object.keys(single_player.DEFAULTS).sort());
});

test("scales apply percents and cap success chances at 100%", () => {
	const sp = single_player.create({
		sell_multiplier: 2,
		upgrade_success: 3,
		mp_usage: 0,
		damage_rate: 2,
		drop_rate: 2,
		xp_rate: 2.5,
	});
	assert.equal(sp.scale("sell", 1000), 2000);
	assert.equal(sp.scale("upgrade", 0.5), 1);
	assert.equal(sp.scale("compound", 0.5), 0.5);
	assert.equal(sp.scale("mp", 80), 0);
	assert.equal(sp.scale("drop", 1), 2);
	assert.equal(sp.scale("xp", 100), 250);
	assert.equal(sp.scale("damage", 120), 240);
});

test("old HP loss and MP usage percents become multipliers", () => {
	assert.deepEqual(single_player.parse("hp_loss_percent = 50\nmp_usage_percent = 0\n"), { hp_loss: 0.5, mp_usage: 0 });
	assert.equal(
		single_player.rename_settings("# Damage your characters take. 50 = you lose half as much HP,\n# 0 = you never lose HP from attacks.\nhp_loss_percent = 50\n"),
		"# Damage your characters take. A multiplier: 1 = normal,\n# 0.5 = you lose half as much HP, 0 = you never lose HP from attacks.\nhp_loss = 0.5\n",
	);
});

test("old upgrade and compound percents become multipliers", () => {
	const values = single_player.parse("upgrade_success_percent = 250\ncompound_success_percent = 50\n");
	assert.equal(values.upgrade_success, 2.5);
	assert.equal(values.compound_success, 0.5);
	const text = single_player.rename_settings("# Multiplies the success chance. 100 = normal, 200 = twice as\n# likely, 1000 = almost never fails.\nupgrade_success_percent = 300\n");
	assert.match(text, /^upgrade_success = 3$/m);
	assert.match(text, /1 = normal, 2 = twice as/);
});

test("events and character limits are switched on from settings", () => {
	const sp = single_player.create({ holiday_season: true, halloween: true, egg_hunt: true, max_characters_online: 8 });
	const events = { holidayseason: false, halloween: false, valentines: false, egghunt: 0 };
	sp.apply_events(events);
	assert.deepEqual(events, {
		holidayseason: true,
		snowman: 60,
		lunarnewyear: false,
		halloween: true,
		valentines: false,
		pinkgoo: 0,
		egghunt: 60,
	});
	const options = { character_limit: 3, ip_limit: 3 };
	sp.apply_options(options);
	assert.deepEqual(options, { character_limit: 8, ip_limit: 8 });
});

test("Ponty stock only holds gear at or above the minimum grade, within the level ranges", () => {
	const G = {
		items: {
			blade: { upgrade: {}, grades: [7, 9] },
			ring: { compound: {}, grades: [2, 4] },
			potion: { s: 9999 },
			gold_thing: { upgrade: {}, cash: true },
		},
	};
	const grade = (def, item) => (item.level >= def.grades[1] ? 2 : item.level >= def.grades[0] ? 1 : 0);
	const sp = single_player.create({ ponty_item_count: 30, ponty_min_grade: 1 });
	const stock = sp.ponty_stock(G, grade);
	assert.equal(stock.length, 30);
	for (const entry of stock) {
		assert.ok(["blade", "ring"].includes(entry.name));
		if (entry.name == "blade") assert.ok(entry.level >= 7 && entry.level <= 9);
		if (entry.name == "ring") assert.ok(entry.level >= 2 && entry.level <= 4);
	}
});

test("single player website blocks payments and online-only pages and API calls", () => {
	const web = require("../../singleplayer/web");
	const blocked = (path) => {
		let status = 200;
		web.block_paths({ path }, { status: (s) => ((status = s), { send() {} }) }, () => {});
		return status;
	};
	["/shells", "/steam-purchase", "/steam-signin/start", "/mcp", "/mcp_api/x", "/r/abc", "/sitemap.xml", "/mainframe", "/docs/guide/hub", "/docs/guide/advanced/pvp", "/docs/guide/limits"].forEach((p) =>
		assert.equal(blocked(p), 404, p),
	);
	["/", "/character/Me/in/US/I/", "/data.js", "/api/servers_and_characters", "/docs", "/docs/guide/characters-and-limits", "/docs/guide/multi"].forEach((p) =>
		assert.equal(blocked(p), 200, p),
	);
	const REF = { stripe_payment: {}, steam_payment_start: {}, save_code: {} };
	web.restrict_api(REF);
	assert.deepEqual(Object.keys(REF), ["save_code"]);
});

test("single player auto login signs into the built-in account once, then reloads the page", async () => {
	const web = require("../../singleplayer/web");
	const run = async (req, user, result) => {
		const out = { next: false, redirect: null, args: null };
		const middleware = web.auto_login({
			get_user: async () => user,
			signup_or_login: async (args) => ((out.args = args), result),
		});
		await middleware(
			{
				method: "GET",
				path: req.split("?")[0],
				originalUrl: req,
				query: req.includes("auto_login") ? { auto_login: "1" } : {},
			},
			{ redirect: (url) => (out.redirect = url) },
			() => (out.next = true),
		);
		return out;
	};
	const fresh = await run("/", null, { success: true });
	assert.equal(fresh.redirect, "/?auto_login=1");
	assert.equal(fresh.args.email, web.ACCOUNT.email);
	assert.equal(fresh.args.password, web.ACCOUNT.password);
	assert.equal((await run("/", { _id: "US_x" }, { success: true })).next, true);
	assert.equal((await run("/?auto_login=1", null, { success: true })).next, true);
	assert.equal((await run("/", null, { failed: true, reason: "exception" })).next, true);
});

test("fishing and mining cooldown can be switched off", () => {
	const G = { skills: { fishing: { reuse_cooldown: 100 }, mining: { reuse_cooldown: 200 }, attack: { cooldown: 5 } } };
	single_player.create({ fishing_mining_cooldown: true }).apply_game_data(G);
	assert.equal(G.skills.fishing.reuse_cooldown, 100);
	single_player.create({ fishing_mining_cooldown: false }).apply_game_data(G);
	assert.equal(G.skills.fishing.reuse_cooldown, 0);
	assert.equal(G.skills.mining.reuse_cooldown, 0);
	assert.equal(G.skills.attack.cooldown, 5);
});

test("settings missing from an older settings.txt are found with their notes", () => {
	const example =
		"# Shops\nsell_multiplier = 1\n\n# Gold for new characters\n# (only new ones)\nstarting_gold = 10000000\n";
	assert.deepEqual(single_player.missing_settings("sell_multiplier = 3\n", example), [
		"# Gold for new characters\r\n# (only new ones)\r\nstarting_gold = 10000000",
	]);
	assert.deepEqual(single_player.missing_settings("sell_multiplier = 3\r\nstarting_gold = 5\r\n", example), []);
});

test("Merrit's visit timer comes from the settings and his settle wait is removed", () => {
	const G = { skills: {}, npcs: { citizen22: { market: { hour_ms: 3600000, settle_ms: 120000 } } } };
	single_player.create({ merrit_visit_minutes: 5 }).apply_game_data(G);
	assert.equal(G.npcs.citizen22.market.hour_ms, 5 * 60 * 1000);
	assert.equal(G.npcs.citizen22.market.settle_ms, 0);
});

test("holiday events toggle while running, and the choice is written into settings.txt", () => {
	const sp = single_player.create({ halloween: true });
	const events = {};
	sp.apply_events(events);
	assert.equal(sp.toggle_event(events, "nonsense", true), false);
	assert.equal(events.valentines, false);
	sp.toggle_event(events, "valentines", true);
	assert.equal(events.valentines, true);
	assert.equal(events.pinkgoo, 60);
	assert.equal(sp.settings.valentines, true);

	const file = path.join(os.tmpdir(), "single_player_settings_" + process.pid + ".txt");
	fs.writeFileSync(file, "# notes\r\nhalloween = yes\r\negg_hunt = yes   # trailing note\r\n");
	single_player.save_setting(file, "halloween", "no");
	single_player.save_setting(file, "egg_hunt", "no");
	single_player.save_setting(file, "valentines", "yes");
	assert.equal(
		fs.readFileSync(file, "utf8"),
		"# notes\r\nhalloween = no\r\negg_hunt = no # trailing note\r\nvalentines = yes\r\n",
	);
	fs.unlinkSync(file);
});

test("event monsters switch on and off on their own, apart from their holiday", () => {
	const sp = single_player.create({ holiday_season: false, monster_grinch: true, monster_snowman: false });
	const events = {};
	sp.apply_events(events);
	assert.equal(sp.monster_on("grinch"), true);
	assert.equal(sp.monster_on("snowman"), false);
	assert.equal(sp.toggle_event(events, "snowman", true), "monster");
	assert.equal(sp.monster_on("snowman"), true);
	assert.equal(events.holidayseason, false);
	assert.equal(sp.toggle_event(events, "holidayseason", true), "event");
	assert.equal(sp.event_state().events.holidayseason, true);
	assert.equal(sp.event_state().monsters.snowman, true);
});

test("characters made with a pre-v19 E to H look move onto the current look for that letter", async () => {
	const sp = require("../logic/single_player");
	const look = sp.upgraded_look("warrior", "marmor6c", { head: "fmakeup01", hair: "hairdo519", upper: "kept" });
	assert.deepEqual(look, { skin: "marmor3f", cx: { upper: "kept", hair: "hairdo417", hat: "hat300", chin: "beard100", head: "mmakeup02" } });
	assert.equal(sp.upgraded_look("warrior", "marmor6c", { head: "fmakeup01", hair: "hairdo100" }), null);
	assert.equal(sp.upgraded_look("warrior", "marmor3f", sp.CLASS_LOOKS.warrior[0][1]), null);
	const docs = {
		character: [{ _id: "CH1", type: "ranger", owner: "US1", info: { skin: "marmor5c", cx: { head: "fmakeup01", hair: "hairdo208", hat: "hat221" } } }],
		user: [{ _id: "US1", info: { characters: [{ id: "CH9" }, { id: "CH1", skin: "marmor5c", cx: {} }] } }],
	};
	const set = (doc, path, value) => {
		const keys = path.split(".");
		let at = doc;
		for (const key of keys.slice(0, -1)) at = at[key];
		at[keys[keys.length - 1]] = value;
	};
	const db = {
		collection: (name) => ({
			find: (q) => ({ toArray: async () => docs[name].filter((d) => d.type == q.type) }),
			findOne: async (q) => docs[name].find((d) => d._id == q._id),
			updateOne: async (q, u) => {
				const doc = docs[name].find((d) => d._id == q._id);
				for (const [path, value] of Object.entries(u.$set)) set(doc, path, value);
			},
		}),
	};
	assert.equal(await sp.upgrade_looks(db), 1);
	assert.equal(docs.character[0].info.skin, "marmor8g");
	assert.equal(docs.user[0].info.characters[1].skin, "marmor8g");
	assert.equal(docs.user[0].info.characters[1].cx.hat, "hat106g");
	assert.equal(await sp.upgrade_looks(db), 0);
});

test("Shells are replaced by seashells: prices, bag payments and drop tables", () => {
	const sp = require("../logic/single_player");
	assert.equal(sp.seashell_price(75), 625);
	assert.equal(sp.seashell_price(1399), 11659); // rounded up
	assert.equal(sp.seashell_price(0), 0);
	assert.equal(sp.BLESSING_SEASHELLS, 10000);
	const bag = [{ name: "seashell", q: 9999 }, null, { name: "hpot0", q: 5 }, { name: "seashell", q: 50 }];
	assert.equal(sp.count_items(bag, "seashell"), 10049);
	assert.equal(sp.take_items(bag, "seashell", 20000), false);
	assert.equal(bag[0].q, 9999);
	assert.equal(sp.take_items(bag, "seashell", 10000), true);
	assert.equal(bag[0], null);
	assert.equal(bag[3].q, 49);
	const drops = { monsters: { goo: [[0.001, "shells", 50], [1, "gslime"]] }, "5bucks": [[0.02, "5bucks", 2], [1, "shells", 800]], gem1: [[1, "gold", 5], [0.001, "shells", 50]] };
	sp.strip_shell_drops(drops);
	assert.deepEqual(drops.monsters.goo, [[1, "gslime"]]);
	assert.deepEqual(drops.gem1, [[1, "gold", 5]]);
	assert.deepEqual(drops["5bucks"], [[0.02, "5bucks", 2], [1, "seashell", 6667]]);
	const G = { items: { cosmo0: { cash: 289 }, hpot0: { g: 20 } }, drops: { x: [[1, "shells", 75]] }, classes: {} };
	sp.create({}).apply_game_data(G);
	assert.equal(G.items.cosmo0.seashells, 2410); // set by hand
	assert.equal(sp.item_seashell_price("cosmo2", 129, 1), 1075);
	assert.deepEqual([1, 2, 3, 4, 5, 12].map((length) => sp.rename_seashells(length, 640)), [350000, 150000, 50000, 10000, 5334, 5334]);
	assert.equal(G.items.hpot0.seashells, undefined);
	assert.deepEqual(G.drops.x, [[1, "seashell", 625]]);
});

test("the game server's single player object has the seashell helpers", () => {
	const instance = require("../logic/single_player").create({});
	assert.equal(instance.BLESSING_SEASHELLS, 10000);
	assert.equal(instance.seashell_price(75), 625);
	assert.equal(typeof instance.strip_shell_drops, "function");
});

test("respawn time, death penalty, skill cooldowns, run speed and safe upgrades", () => {
	const sp = single_player.create({});
	const settings = sp.settings;
	assert.equal(sp.scale("respawn", 1000), 1000);
	assert.equal(sp.scale("death", 500), 500);
	assert.equal(sp.scale("speed", 1), 1);
	settings.monster_respawn = 0.5;
	settings.death_penalty = 0;
	settings.run_speed = 1.5;
	assert.equal(sp.scale("respawn", 1000), 500);
	assert.equal(sp.scale("death", 500), 0);
	assert.equal(sp.scale("speed", 1), 1.5);
	assert.equal(single_player.check_value("run_speed", 50), 5);
	assert.equal(single_player.DEFAULTS.safe_upgrades, false);
	// Skill cooldowns follow the setting while the game runs; monster skills are left alone
	const G = { skills: { charge: { cooldown: 40000 }, fishing: { reuse_cooldown: 300000 }, rimeshatter: { cooldown: 8000, monster: true } } };
	settings.fishing_mining_cooldown = true;
	sp.apply_game_data(G);
	assert.equal(G.skills.charge.cooldown, 40000);
	settings.skill_cooldown = 0.5;
	sp.apply_cooldowns();
	assert.equal(G.skills.charge.cooldown, 20000);
	assert.equal(G.skills.fishing.reuse_cooldown, 150000);
	assert.equal(G.skills.rimeshatter.cooldown, 8000);
	settings.skill_cooldown = 0;
	sp.apply_cooldowns();
	assert.equal(G.skills.charge.cooldown, 0);
	settings.skill_cooldown = 1;
	sp.apply_cooldowns();
	assert.equal(G.skills.charge.cooldown, 40000);
	// The home page counts what's changed in each group
	const combat = sp.mod_state().groups.find((group) => group.name == "Combat");
	assert.equal(combat.changed, 1); // death penalty
});

test("trader discount, exchange luck and give gold", () => {
	const sp = single_player.create({});
	const settings = sp.settings;
	assert.equal(sp.shop_price(1000), 1000);
	settings.trader_discount = 25;
	assert.equal(sp.shop_price(1000), 750);
	settings.fire_sale = true;
	assert.equal(sp.shop_price(1000), 0);
	assert.equal(single_player.check_value("trader_discount", 150), 100);
	const table = [
		[100, "hpot0", 1],
		[10, "ring", 1],
		[5, "empty"],
	];
	assert.equal(sp.luck_table(table), table);
	settings.exchange_luck = 2;
	assert.deepEqual(sp.luck_table(table), [
		[100, "hpot0", 1],
		[20, "ring", 1],
		[5, "empty"],
	]);
	assert.equal(table[1][0], 10); // the game's table isn't changed
	assert.equal(sp.luck_chance(0.3), 0.6);
	assert.equal(sp.luck_chance(0.8), 1);
	// The amount Give Gold remembers isn't counted as a change
	settings.give_gold = 5;
	const characters = sp.mod_state().groups.find((group) => group.name == "Characters");
	assert.equal(characters.changed, 0);
	assert.equal(characters.rows.find((row) => row.key == "give_gold").button, "Send Gold");
});

test("the hidden files list only names files in the game folder, and never what players use", () => {
	const root = path.resolve(__dirname, "../..");
	const lines = fs
		.readFileSync(path.join(root, "singleplayer/hidden.txt"), "utf8")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));
	assert.ok(lines.includes("steam_news.js") && lines.includes("steam_signin.js") && lines.includes("steam_signup.js"));
	const normal = lines.map((line) => line.replace(/\\/g, "/").toLowerCase());
	for (const line of lines) assert.ok(!/^[a-z]:|^[\\/]|\.\.|[*?"<>|]/i.test(line), line + " is a plain relative name");
	for (const used of ["fantasy land.exe", "play.bat", "stop.bat", "settings.txt", "readme.md", "changelog.md", "license", "logs", "singleplayer", "singleplayer/data"])
		assert.ok(!normal.includes(used), used + " stays visible");
	// Play.bat applies the list, and everything it names that is part of the game exists
	assert.match(fs.readFileSync(path.join(root, "Play.bat"), "utf8"), /singleplayer\\hidden\.txt[\s\S]*attrib \+h/);
	for (const line of lines)
		if (!/^\.|node_modules|secretsandconfig|^tauri$|^useful$|mongodb_todo|UPDATE_NOTES/.test(line)) assert.ok(fs.existsSync(path.join(root, line.replace(/\\/g, "/"))), line + " exists");
});

test("Win + opens another game window next to the Mod Menu icon", () => {
	const root = path.resolve(__dirname, "../..");
	const html = fs.readFileSync(path.join(root, "js/html.js"), "utf8");
	assert.match(html, /sp-newwin[^"]*'[^]*?open_character_window\(\)[^]*?Win \+/);
	assert.match(fs.readFileSync(path.join(root, "css/index.css"), "utf8"), /#sp-modmenu \.sp-newwin\{[^}]*width: calc\(100% \+ 10px\)/);
});

test("the redesigned monster sprites each have a sheet of their own that fits the monster", () => {
	const D = require("./helpers/design");
	const root = path.join(__dirname, "..", "..");
	const man = JSON.parse(fs.readFileSync(path.join(root, "images/singleplayer/monsters/manifest.json"), "utf8"));
	assert.equal(man.length, 136);
	for (const v of man) {
		const name = v.cave_body ? v.skin + "_cave" : v.skin;
		const def = D.sprites[name];
		assert.ok(def && def.file == `/images/singleplayer/monsters/${name}.png`, name);
		assert.equal(JSON.stringify(def.matrix), JSON.stringify([[name]]), name);
		const png = fs.readFileSync(path.join(root, def.file.slice(1)));
		assert.equal(png.readUInt32BE(16), v.frame[0] * 3, name + " width");
		assert.equal(png.readUInt32BE(20), v.frame[1] * 4, name + " height");
		if (!v.cave_body)
			for (const s of Object.values(D.sprites))
				if (s !== def) assert.ok(!(s.matrix || []).some((r) => r.includes(v.skin)), v.skin + " still on an old sheet");
	}
	for (const id of ["cave_npc", "cave_darkmage", "cave_rogue", "cave_guard", "cave_mothkeeper"]) assert.ok(/_cave$/.test(D.monsters[id].skin), id);
	assert.equal(D.sprites.marmor6f_cave.type, "armor");
	assert.equal(D.sprites.mbody6b_cave.type, "body");
});

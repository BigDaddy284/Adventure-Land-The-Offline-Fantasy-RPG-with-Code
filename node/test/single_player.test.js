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
	const sp = single_player.create({ hp_loss_percent: 50, drop_rate: 2, gold_drop: 3 });
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
	const keys = sp.mod_state().rows.filter((row) => row.key).map((row) => row.key);
	// Every setting is in the Mod Menu, apart from the holiday ones, which have their own menu
	const holiday = Object.values(single_player.EVENT_SETTINGS).concat(single_player.EVENT_MONSTERS.map((name) => "monster_" + name));
	assert.deepEqual(Object.keys(single_player.DEFAULTS).filter((key) => !keys.includes(key) && !holiday.includes(key)), []);
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
		upgrade_success_percent: 300,
		mp_usage_percent: 0,
		drop_rate: 2,
	});
	assert.equal(sp.scale("sell", 1000), 2000);
	assert.equal(sp.scale("upgrade", 0.5), 1);
	assert.equal(sp.scale("compound", 0.5), 0.5);
	assert.equal(sp.scale("mp", 80), 0);
	assert.equal(sp.scale("drop", 1), 2);
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
	["/shells", "/steam-purchase", "/steam-signin/start", "/mcp", "/mcp_api/x", "/r/abc", "/sitemap.xml"].forEach((p) =>
		assert.equal(blocked(p), 404, p),
	);
	["/", "/character/Me/in/US/I/", "/data.js", "/api/servers_and_characters", "/mainframe", "/docs"].forEach((p) =>
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

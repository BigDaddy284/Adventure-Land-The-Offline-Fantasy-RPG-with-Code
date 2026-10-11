const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const single_player = require("../logic/single_player");

test("settings.txt parsing accepts comments, percent signs, yes/no and ignores bad lines", () => {
	const values = single_player.parse(
		"# note\ndrop_rate_percent = 50%\r\ndrop_everything = yes # inline note\nhp_loss_percent = lots\nunknown = 3\nno equals sign\n",
	);
	assert.deepEqual(values, { drop_rate_percent: 50, drop_everything: true });
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
		drop_rate_percent: 200,
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
	assert.deepEqual(events, { holidayseason: true, halloween: true, valentines: false, egghunt: 60 });
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

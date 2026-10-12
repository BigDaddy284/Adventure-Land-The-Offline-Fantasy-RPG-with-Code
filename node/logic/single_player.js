"use strict";

// Single player settings: reads settings.txt (copied from settings.example.txt on first run)
// and exposes the multipliers the game server applies. Kept in one file so upstream merges stay easy.

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const SETTINGS_FILE = path.join(ROOT, "settings.txt");
const EXAMPLE_FILE = path.join(ROOT, "settings.example.txt");

const DEFAULTS = {
	sell_multiplier: 1,
	ponty_restock_minutes: 0,
	ponty_item_count: 20,
	ponty_min_grade: 1,
	ponty_upgrade_level_min: 6,
	ponty_upgrade_level_max: 9,
	ponty_compound_level_min: 2,
	ponty_compound_level_max: 4,
	upgrade_success_percent: 100,
	compound_success_percent: 100,
	mp_usage_percent: 100,
	hp_loss_percent: 100,
	drop_rate: 1,
	gold_drop: 1,
	drop_everything: false,
	monster_hunt_tokens: 1,
	fire_sale: false,
	god_mode: false,
	holiday_season: false,
	lunar_new_year: false,
	valentines: false,
	halloween: false,
	egg_hunt: false,
	monster_mrpumpkin: true,
	monster_mrgreen: true,
	monster_slenderman: true,
	monster_grinch: true,
	monster_snowman: true,
	monster_dragold: true,
	monster_pinkgoo: true,
	monster_wabbit: true,
	max_characters_online: 3,
	fishing_mining_cooldown: true,
	tools_break: true,
	starting_gold: 0,
	merrit_visit_minutes: 60,
	merrit_buys_stall: false,
};

// Settings that were renamed: old name -> [new name, divide the old value by]
const RENAMED = {
	drop_rate_percent: ["drop_rate", 100],
	gold_drop_percent: ["gold_drop", 100],
};

// Settings that were taken out, skipped without a warning and removed from settings.txt
const REMOVED = ["ponty_keep_sold_items"];

function parse(text) {
	const values = {};
	const renamed = {};
	text.split(/\r?\n/).forEach(function (line, index) {
		line = line.replace(/#.*$/, "").trim();
		if (!line) return;
		const eq = line.indexOf("=");
		if (eq == -1) return console.warn("settings.txt line " + (index + 1) + " has no '=', ignored: " + line);
		const key = line.slice(0, eq).trim().toLowerCase();
		const raw = line
			.slice(eq + 1)
			.trim()
			.replace(/%$/, "")
			.toLowerCase();
		if (REMOVED.includes(key)) return;
		if (key in RENAMED) {
			const number = Number(raw);
			if (raw !== "" && Number.isFinite(number) && number >= 0) renamed[RENAMED[key][0]] = number / RENAMED[key][1];
			return;
		}
		if (!(key in DEFAULTS)) return console.warn("settings.txt: unknown setting '" + key + "', ignored");
		if (typeof DEFAULTS[key] == "boolean") {
			if (["yes", "true", "on", "1"].includes(raw)) values[key] = true;
			else if (["no", "false", "off", "0"].includes(raw)) values[key] = false;
			else console.warn("settings.txt: '" + key + "' should be yes or no, using default");
		} else {
			const number = Number(raw);
			if (raw === "" || !Number.isFinite(number) || number < 0)
				console.warn("settings.txt: '" + key + "' should be a number 0 or above, using default");
			else values[key] = number;
		}
	});
	Object.keys(renamed).forEach((key) => key in values || (values[key] = renamed[key]));
	return values;
}

// Old notes written above a renamed setting, swapped for the new ones when settings.txt is updated
const RENAMED_NOTES = [
	[
		"# Item drop chance from every monster, everywhere.\r\n# 100 = normal, 200 = twice as many drops, 0 = nothing drops.\r\n",
		"# Item drop chance from every monster, everywhere. A multiplier:\r\n# 1 = normal, 2 = every item is twice as likely to drop,\r\n# 0.5 = half as likely, 0 = nothing drops.\r\n",
	],
	["# Gold dropped by monsters. 100 = normal.\r\n", "# Gold dropped by monsters. A multiplier: 1 = normal, 2 = double.\r\n"],
	["# Very silly. Overrides drop_rate_percent.", "# Very silly. Overrides drop_rate."],
];

// Brings an older settings.txt up to date: renamed settings get their new names (drop_rate_percent = 200 becomes
// drop_rate = 2) and removed ones are taken out
function rename_settings(text) {
	Object.keys(RENAMED).forEach(function (old) {
		const pattern = new RegExp("^([ \\t]*)" + old + "([ \\t]*=[ \\t]*)([^#\\r\\n]*?)%?([ \\t]*(#[^\\r\\n]*)?)(?=\\r?$)", "im");
		text = text.replace(pattern, function (line, indent, eq, value, rest) {
			const number = Number(value.trim());
			const converted = value.trim() !== "" && Number.isFinite(number) ? String(number / RENAMED[old][1]) : value;
			return indent + RENAMED[old][0] + eq + converted + rest;
		});
	});
	REMOVED.forEach(function (key) {
		// the setting's line, with the notes written straight above it
		text = text.replace(new RegExp("(^[ \\t]*\\r?\\n)?(^[ \\t]*#[^\\r\\n]*\\r?\\n)*^[ \\t]*" + key + "[ \\t]*=[^\\r\\n]*(\\r?\\n)?", "gim"), "");
	});
	RENAMED_NOTES.forEach(function ([before, after]) {
		text = text.split(before).join(after).split(before.replace(/\r\n/g, "\n")).join(after.replace(/\r\n/g, "\n"));
	});
	return text;
}

// Settings in example_text that text doesn't mention yet, each with the notes written above it
function missing_settings(text, example_text) {
	const present = new Set(
		text
			.split(/\r?\n/)
			.map((line) => line.replace(/#.*$/, "").split("=")[0].trim().toLowerCase())
			.filter((key) => key in DEFAULTS),
	);
	let notes = [];
	const blocks = [];
	example_text.split(/\r?\n/).forEach(function (line) {
		const key = line.replace(/#.*$/, "").split("=")[0].trim().toLowerCase();
		if (!line.trim()) notes = [];
		else if (line.trim().startsWith("#")) notes.push(line);
		else {
			if (key in DEFAULTS && !present.has(key)) blocks.push(notes.concat(line).join("\r\n"));
			notes = [];
		}
	});
	return blocks;
}

function load() {
	if (!fs.existsSync(SETTINGS_FILE) && fs.existsSync(EXAMPLE_FILE)) fs.copyFileSync(EXAMPLE_FILE, SETTINGS_FILE);
	if (fs.existsSync(SETTINGS_FILE)) {
		const text = fs.readFileSync(SETTINGS_FILE, "utf8");
		const renamed = rename_settings(text);
		if (renamed != text) fs.writeFileSync(SETTINGS_FILE, renamed);
	}
	// Settings added by a newer version go to the end of an older settings.txt
	if (fs.existsSync(SETTINGS_FILE) && fs.existsSync(EXAMPLE_FILE)) {
		const blocks = missing_settings(fs.readFileSync(SETTINGS_FILE, "utf8"), fs.readFileSync(EXAMPLE_FILE, "utf8"));
		if (blocks.length)
			fs.appendFileSync(
				SETTINGS_FILE,
				"\r\n\r\n# ---------- Added by a game update ----------\r\n\r\n" + blocks.join("\r\n\r\n") + "\r\n",
			);
	}
	let values = {};
	if (fs.existsSync(SETTINGS_FILE)) values = parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
	const settings = Object.assign({}, DEFAULTS, values);
	console.log("Single player settings (" + SETTINGS_FILE + "):");
	Object.keys(settings).forEach((key) => console.log("  " + key + " = " + settings[key]));
	return settings;
}

// Holiday events (the game's names) and their settings.txt names
const EVENT_SETTINGS = {
	holidayseason: "holiday_season",
	lunarnewyear: "lunar_new_year",
	valentines: "valentines",
	halloween: "halloween",
	egghunt: "egg_hunt",
};

// Event monsters that can be switched on and off one by one
const EVENT_MONSTERS = ["mrpumpkin", "mrgreen", "slenderman", "grinch", "snowman", "dragold", "pinkgoo", "wabbit"];

function set_event(events, name, on) {
	events[name] = name == "egghunt" ? (on ? 60 : 0) : !!on; // Egg hunt: minutes between bunnies
	if (name == "holidayseason") events.snowman = on ? 60 : 20 * 60; // Snowman every hour in season, the game's normal 20 hours otherwise
	if (name == "valentines") events.pinkgoo = on ? 60 : 0;
}

// Changes one value in settings.txt, keeping the notes and the rest of the file as they are
function save_setting(file, key, value) {
	const text = fs.readFileSync(file, "utf8");
	const pattern = new RegExp("^([ \\t]*" + key + "[ \\t]*=)([^#\\r\\n]*)", "m");
	const updated = pattern.test(text)
		? text.replace(pattern, (line, name, old) => name + " " + value + (/\s$/.test(old) && old.trim() ? " " : ""))
		: text.replace(/\s*$/, "") + "\r\n" + key + " = " + value + "\r\n";
	fs.writeFileSync(file, updated);
}

const SCALES = {
	upgrade: "upgrade_success_percent",
	compound: "compound_success_percent",
	mp: "mp_usage_percent",
	hp_loss: "hp_loss_percent",
};
const MULTIPLIERS = {
	sell: "sell_multiplier",
	drop: "drop_rate",
	gold: "gold_drop",
};

// What the Mod Menu shows, in order: [setting, label, note]. A section is a string on its own.
// Settings in RESTART only take effect the next time the game starts.
const MOD_MENU = [
	"Cheats",
	["god_mode", "God Mode", "Your characters take no damage"],
	["fire_sale", "Fire Sale", "Everything in the NPC shops, Ponty and Lost and Found is free"],
	"Drops",
	["drop_rate", "Drop luck", "1 = normal, 2 = every item twice as likely to drop"],
	["gold_drop", "Gold dropped", "1 = normal, 2 = twice as much gold"],
	["drop_everything", "Drop everything", "Every monster drops its whole drop list"],
	["monster_hunt_tokens", "Daisy's tokens", "Monster tokens for each finished hunt"],
	"Combat",
	["hp_loss_percent", "HP loss %", "100 = normal, 50 = half damage, 0 = none"],
	["mp_usage_percent", "MP usage %", "100 = normal, 0 = skills cost no MP"],
	"Upgrading",
	["upgrade_success_percent", "Upgrade chance %", "100 = normal, 200 = twice as likely"],
	["compound_success_percent", "Compound chance %", "100 = normal, 200 = twice as likely"],
	"Shops",
	["sell_multiplier", "Sell price", "1 = normal, 2 = NPCs pay double"],
	["starting_gold", "Starting gold", "Gold for each new character"],
	"Ponty",
	["ponty_restock_minutes", "Restock minutes", "0 = normal Ponty"],
	["ponty_item_count", "Items per restock", ""],
	["ponty_min_grade", "Lowest grade", "0 any, 1 high, 2 rare, 3 legendary"],
	["ponty_upgrade_level_min", "Upgrade level from", ""],
	["ponty_upgrade_level_max", "Upgrade level to", ""],
	["ponty_compound_level_min", "Compound level from", ""],
	["ponty_compound_level_max", "Compound level to", ""],
	"Merrit",
	["merrit_visit_minutes", "Visit minutes", "Minutes between parcels"],
	["merrit_buys_stall", "Buys your stall", "Buys everything on the stall each visit"],
	"Gathering",
	["fishing_mining_cooldown", "Fishing and mining wait", "Off = fish and mine again straight away"],
	["tools_break", "Tools break", "Rods and pickaxes can break"],
	"Characters",
	["max_characters_online", "Characters online", "How many can play at once"],
];
const RESTART = ["fishing_mining_cooldown", "merrit_visit_minutes"];
// Whole numbers only, and the highest each can go
const WHOLE = {
	monster_hunt_tokens: 9999,
	ponty_item_count: 400,
	ponty_min_grade: 3,
	ponty_upgrade_level_min: 12,
	ponty_upgrade_level_max: 12,
	ponty_compound_level_min: 7,
	ponty_compound_level_max: 7,
	max_characters_online: 18,
	starting_gold: 1e12,
	merrit_visit_minutes: 1e6,
};

// Checks a value from the Mod Menu: true/false for yes/no settings, a number 0 or above for the rest.
// Returns the value to use, or undefined when it can't be used.
function check_value(key, value) {
	if (!(key in DEFAULTS)) return undefined;
	if (typeof DEFAULTS[key] == "boolean") return typeof value == "boolean" ? value : undefined;
	const number = Number(value);
	if (value === "" || value === null || typeof value == "boolean" || !Number.isFinite(number) || number < 0) return undefined;
	if (key in WHOLE) return Math.min(WHOLE[key], Math.round(number));
	return Math.round(number * 1000) / 1000;
}

// Extra starting looks, added after each class's original four (so A to D stay the same)
// Each design comes in its main skin tone and an alternate one
const NEW_LOOKS = {
	warrior: [
		["marmor6g", { head: "makeup104", hair: "hairdo417", chin: "beard111" }], // Ironclad Veteran
		["marmor6g", { head: "makeup117", hair: "hairdo417", chin: "beard111" }],
		["marmor6c", { head: "fmakeup01", hair: "hairdo519" }], // Frost Shieldmaiden
		["marmor6c", { head: "fmakeup03", hair: "hairdo519" }],
	],
	rogue: [
		["sbody1d", { head: "makeup108", hair: "hairdo415", chin: "beard112" }], // Ashen Hood
		["sbody1d", { head: "makeup117", hair: "hairdo415", chin: "beard112" }],
		["sarmor1g", { head: "fmakeup01", hair: "hairdo600" }], // Crimson Knife
		["sarmor1g", { head: "fmakeup03", hair: "hairdo600" }],
	],
	mage: [
		["mbody1e", { head: "makeup117", hair: "hairdo111", chin: "beard104" }], // Ember Sage
		["mbody1e", { head: "makeup105", hair: "hairdo111", chin: "beard104" }],
		["mbody5h", { head: "fmakeup01", hair: "hairdo301", hat: "hat102" }], // Tidecaller Witch
		["mbody5h", { head: "fmakeup03", hair: "hairdo301", hat: "hat102" }],
	],
	paladin: [
		["mbody3c", { head: "makeup105", hair: "hairdo320" }], // Sunforged Templar
		["mbody3c", { head: "makeup117", hair: "hairdo320" }],
	],
	merchant: [
		["marmor11g", { head: "makeup104", hair: "hairdo105", hat: "hat213", chin: "beard109" }], // Trailwise Trader
		["marmor11g", { head: "makeup117", hair: "hairdo105", hat: "hat213", chin: "beard109" }],
	],
	ranger: [
		["marmor5c", { head: "fmakeup03", hair: "hairdo208", hat: "hat221" }], // Greenwood Warden
		["marmor5c", { head: "fmakeup01", hair: "hairdo208", hat: "hat221" }],
	],
	priest: [
		["mbody4g", { head: "nfmakeup06", hair: "hairdo602" }], // Silver Oracle
		["mbody4g", { head: "fmakeup01", hair: "hairdo602" }],
	],
};

// Adds the extra looks to the class definitions; safe to run more than once
function add_looks(classes) {
	for (const name of Object.keys(NEW_LOOKS)) {
		const looks = classes && classes[name] && classes[name].looks;
		if (!looks) continue;
		const have = new Set(looks.map((look) => JSON.stringify(look)));
		for (const look of NEW_LOOKS[name]) if (!have.has(JSON.stringify(look))) looks.push(JSON.parse(JSON.stringify(look)));
	}
	return classes;
}

function create(settings) {
	let base_limits = null;
	return {
		settings,
		// Applies one setting to a value; success chances are capped at 100%
		scale(kind, value) {
			if (kind == "hp_loss" && settings.god_mode) return 0;
			if (kind in MULTIPLIERS) return value * settings[MULTIPLIERS[kind]];
			const result = value * (settings[SCALES[kind]] / 100);
			return kind == "upgrade" || kind == "compound" ? Math.min(1, result) : result;
		},
		apply_events(events) {
			Object.keys(EVENT_SETTINGS).forEach((name) => set_event(events, name, settings[EVENT_SETTINGS[name]]));
		},
		// Turns a holiday event or an event monster on or off while the game runs, and saves the choice to settings.txt.
		// Returns "event", "monster", or false for an unknown name.
		toggle_event(events, name, on) {
			let key, kind;
			if (Object.prototype.hasOwnProperty.call(EVENT_SETTINGS, name)) {
				set_event(events, name, on);
				((key = EVENT_SETTINGS[name]), (kind = "event"));
			} else if (EVENT_MONSTERS.includes(name)) ((key = "monster_" + name), (kind = "monster"));
			else return false;
			settings[key] = !!on;
			if (fs.existsSync(SETTINGS_FILE)) save_setting(SETTINGS_FILE, key, on ? "yes" : "no");
			return kind;
		},
		// Whether an event monster spawns: each one is switched on its own, whatever its holiday is doing
		monster_on(name) {
			return !!settings["monster_" + name];
		},
		// What the holiday events menu shows
		event_state() {
			const state = { events: {}, monsters: {} };
			Object.keys(EVENT_SETTINGS).forEach((name) => (state.events[name] = !!settings[EVENT_SETTINGS[name]]));
			EVENT_MONSTERS.forEach((name) => (state.monsters[name] = !!settings["monster_" + name]));
			return state;
		},
		// Changes to the game data (G) the server and website build from the design files
		apply_game_data(G) {
			if (!settings.fishing_mining_cooldown)
				["fishing", "mining"].forEach(function (name) {
					if (G.skills && G.skills[name]) G.skills[name].reuse_cooldown = 0;
				});
			const merrit = G.npcs && G.npcs.citizen22 && G.npcs.citizen22.market;
			if (merrit) {
				merrit.hour_ms = settings.merrit_visit_minutes * 60 * 1000;
				merrit.settle_ms = 0; // no wait after the stall opens
			}
			add_looks(G.classes);
			return G;
		},
		apply_options(options) {
			// The game's own limits are remembered, so lowering the setting while playing works too
			if (!base_limits) base_limits = { character_limit: options.character_limit || 0, ip_limit: options.ip_limit || 0 };
			const most = Math.max(1, settings.max_characters_online);
			options.character_limit = Math.max(base_limits.character_limit, most);
			options.ip_limit = Math.max(base_limits.ip_limit, most);
		},
		// Changes one setting while the game runs and saves it to settings.txt.
		// Returns the value that was used, or undefined when the name or value can't be used.
		change(key, value) {
			value = check_value(key, value);
			if (value === undefined) return undefined;
			settings[key] = value;
			if (fs.existsSync(SETTINGS_FILE))
				save_setting(SETTINGS_FILE, key, typeof value == "boolean" ? (value ? "yes" : "no") : String(value));
			return value;
		},
		// What the Mod Menu shows: sections and rows with their current values
		mod_state() {
			return {
				rows: MOD_MENU.map((row) =>
					typeof row == "string"
						? { section: row }
						: {
								key: row[0],
								label: row[1],
								note: row[2],
								value: settings[row[0]],
								yesno: typeof DEFAULTS[row[0]] == "boolean",
								restart: RESTART.includes(row[0]),
							},
				),
			};
		},
		// One setting as settings.txt has it right now (for the website, which runs separately from the game server)
		current(key) {
			if (!fs.existsSync(SETTINGS_FILE)) return settings[key];
			const values = parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
			return key in values ? values[key] : DEFAULTS[key];
		},
		// A fresh list of random high grade items for Ponty: [{name, level}]
		ponty_stock(G, calculate_item_grade, random) {
			random = random || Math.random;
			const between = (a, b) => Math.floor(Math.min(a, b) + random() * (Math.abs(b - a) + 1));
			const names = Object.keys(G.items).filter(function (name) {
				const def = G.items[name];
				return (def.upgrade || def.compound) && !def.ignore && !def.cash && !name.startsWith("test");
			});
			const stock = [];
			if (!names.length) return stock;
			for (
				let tries = 0;
				stock.length < settings.ponty_item_count && tries < settings.ponty_item_count * 200;
				tries++
			) {
				const name = names[Math.floor(random() * names.length)];
				const def = G.items[name];
				const level = def.upgrade
					? between(settings.ponty_upgrade_level_min, settings.ponty_upgrade_level_max)
					: between(settings.ponty_compound_level_min, settings.ponty_compound_level_max);
				if (calculate_item_grade(def, { name: name, level: level }) < settings.ponty_min_grade) continue;
				stock.push({ name: name, level: level });
			}
			return stock;
		},
	};
}

module.exports = {
	DEFAULTS,
	parse,
	missing_settings,
	rename_settings,
	save_setting,
	MOD_MENU,
	check_value,
	EVENT_SETTINGS,
	EVENT_MONSTERS,
	NEW_LOOKS,
	add_looks,
	create: (values) => create(Object.assign({}, DEFAULTS, values)),
	load: () => create(load()),
};

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
	trader_discount: 0,
	exchange_luck: 1,
	exchange_speed: 1,
	crafting_speed: 1,
	give_gold: 1000000,
	give_xp: 100000,
	ponty_restock_minutes: 0,
	ponty_item_count: 20,
	ponty_min_grade: 1,
	ponty_upgrade_level_min: 6,
	ponty_upgrade_level_max: 9,
	ponty_compound_level_min: 2,
	ponty_compound_level_max: 4,
	upgrade_success: 1,
	compound_success: 1,
	xp_rate: 1,
	damage_rate: 1,
	mp_usage: 1,
	hp_loss: 1,
	death_penalty: 1,
	skill_cooldown: 1,
	run_speed: 1,
	monster_respawn: 1,
	safe_upgrades: false,
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
	upgrade_success_percent: ["upgrade_success", 100],
	compound_success_percent: ["compound_success", 100],
	mp_usage_percent: ["mp_usage", 100],
	hp_loss_percent: ["hp_loss", 100],
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
	[
		"# Multiplies the success chance. 100 = normal, 200 = twice as\r\n# likely, 1000 = almost never fails.",
		"# Multiplies the success chance. 1 = normal, 2 = twice as\r\n# likely, 10 = almost never fails.",
	],
	[
		"# MP spent on attacks and skills. 50 = everything costs half MP,\r\n# 0 = attacks and skills cost no MP.",
		"# MP spent on attacks and skills. A multiplier: 1 = normal,\r\n# 0.5 = everything costs half MP, 0 = attacks and skills cost no MP.",
	],
	[
		"# Damage your characters take. 50 = you lose half as much HP,\r\n# 0 = you never lose HP from attacks.",
		"# Damage your characters take. A multiplier: 1 = normal,\r\n# 0.5 = you lose half as much HP, 0 = you never lose HP from attacks.",
	],
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

const MULTIPLIERS = {
	mp: "mp_usage",
	hp_loss: "hp_loss",
	damage: "damage_rate",
	death: "death_penalty",
	respawn: "monster_respawn",
	cooldown: "skill_cooldown",
	speed: "run_speed",
	sell: "sell_multiplier",
	drop: "drop_rate",
	gold: "gold_drop",
	xp: "xp_rate",
	upgrade: "upgrade_success",
	compound: "compound_success",
};

// What the Mod Menu shows: a home page of groups, each opening its own page. In a group, rows are
// [setting, label, note] and a string on its own starts a section.
// Settings in RESTART only take effect the next time the game starts.
const MOD_MENU = [
	{
		name: "Combat",
		note: "XP, damage, HP, MP, skills and dying",
		rows: [
			["god_mode", "God Mode", "Your characters take no damage"],
			["xp_rate", "XP multiplier", "1 = normal, 2 = double XP from monsters"],
			["damage_rate", "Damage multiplier", "1 = normal, 2 = your hits do double damage"],
			["hp_loss", "HP loss", "1 = normal, 0.5 = half damage taken, 0 = none"],
			["mp_usage", "MP usage", "1 = normal, 0.5 = half MP, 0 = skills cost no MP"],
			["skill_cooldown", "Skill cooldowns", "1 = normal, 0.5 = half the wait, 0 = no wait"],
			["death_penalty", "Death penalty", "XP lost on death: 1 = normal, 0.5 = half, 0 = none"],
		],
	},
	{
		name: "Monsters",
		note: "Respawns, Daisy's hunts and event monsters",
		rows: [
			["monster_respawn", "Respawn time", "Bosses too: 1 = normal, 0.5 = twice as fast, 0 = instant"],
			["monster_hunt_tokens", "Daisy's tokens", "Monster tokens for each finished hunt"],
			"Event Monsters",
			["monster_grinch", "Grinch", "Each spawns even when its holiday is off"],
			["monster_snowman", "Snowman", ""],
			["monster_mrpumpkin", "Mr Pumpkin", ""],
			["monster_mrgreen", "Mr Green", ""],
			["monster_slenderman", "Slenderman", ""],
			["monster_dragold", "Dragold", ""],
			["monster_pinkgoo", "Love Goo", ""],
			["monster_wabbit", "Wabbit", ""],
		],
	},
	{
		name: "Loot",
		note: "Item drops, gold and exchange luck",
		rows: [
			["drop_rate", "Drop luck", "1 = normal, 2 = every item twice as likely to drop"],
			["gold_drop", "Gold dropped", "1 = normal, 2 = twice as much gold"],
			["drop_everything", "Drop everything", "Every monster drops its whole drop list"],
			["exchange_luck", "Exchange luck", "Every exchange, box, fish and mine: 1 = normal, 2 = rare rewards twice as likely"],
			["exchange_speed", "Exchange speed", "How fast exchanges finish: 1 = normal, 2 = double speed, 0.5 = half speed"],
		],
	},
	{
		name: "Crafting & Gathering",
		note: "Upgrading, compounding, fishing and mining",
		rows: [
			["upgrade_success", "Upgrade luck", "1 = normal, 2 = twice the chance of success"],
			["compound_success", "Compound luck", "1 = normal, 2 = twice the chance of success"],
			["crafting_speed", "Crafting speed", "How fast upgrades and compounds finish: 1 = normal, 2 = double speed, 0.5 = half speed"],
			["safe_upgrades", "Safe upgrades", "A failed upgrade or compound keeps your items"],
			"Gathering",
			["fishing_mining_cooldown", "Fishing and mining wait", "Off = fish and mine again straight away"],
			["tools_break", "Tools break", "Rods and pickaxes can break"],
		],
	},
	{
		name: "Market",
		note: "NPC shops, Ponty and Merrit",
		rows: [
			["fire_sale", "Fire Sale", "Everything in the NPC shops, Ponty and Lost and Found is free"],
			["trader_discount", "Trader Discount %", "Off gold prices in NPC shops, Ponty and Lost and Found: 0 = normal, 100 = free"],
			["sell_multiplier", "Sell Item Price", "What NPCs pay for your items: 1 = normal, 2 = double"],
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
		],
	},
	{
		name: "Characters",
		note: "Run speed, characters online and gold",
		rows: [
			["run_speed", "Run speed", "1 = normal, 1.5 = half as fast again, 5 at most"],
			["max_characters_online", "Characters online", "How many can play at once"],
			["starting_gold", "Starting gold", "Gold for each new character"],
			"Gold and XP",
			["give_take", "Give / Take", "Pick Gold or XP, type an amount and a character name, then Give or Take. Leave the name empty for every character online. Taking XP never lowers a level"],
		],
	},
	{
		name: "Holiday Events",
		note: "Switch each holiday on or off",
		rows: [
			["holiday_season", "Holiday Season", ""],
			["lunar_new_year", "Lunar New Year", ""],
			["valentines", "Valentine's", ""],
			["halloween", "Halloween", ""],
			["egg_hunt", "Egg Hunt", ""],
		],
	},
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
	give_gold: 1e12,
	give_xp: 1e12,
};
// Not counted as changed on the Mod Menu's home page: the amount Give Gold remembers isn't a mod
const NOT_COUNTED = ["give_gold", "give_xp"];
// The highest other numbers can go
const MAXIMUM = { run_speed: 5, trader_discount: 100, exchange_speed: 100, crafting_speed: 100 };
// The lowest a number can go, where 0 makes no sense
const MINIMUM = { exchange_speed: 0.1, crafting_speed: 0.1 };

// The game's name for a holiday event or event monster setting (holiday_season -> holidayseason,
// monster_grinch -> grinch), or undefined for any other setting
function holiday_event(key) {
	const event = Object.keys(EVENT_SETTINGS).find((name) => EVENT_SETTINGS[name] == key);
	if (event) return event;
	if (typeof key == "string" && key.startsWith("monster_") && EVENT_MONSTERS.includes(key.slice(8))) return key.slice(8);
}

// Checks a value from the Mod Menu: true/false for yes/no settings, a number 0 or above for the rest.
// Returns the value to use, or undefined when it can't be used.
function check_value(key, value) {
	if (!(key in DEFAULTS)) return undefined;
	if (typeof DEFAULTS[key] == "boolean") return typeof value == "boolean" ? value : undefined;
	const number = Number(value);
	if (value === "" || value === null || typeof value == "boolean" || !Number.isFinite(number) || number < 0) return undefined;
	if (key in WHOLE) return Math.min(WHOLE[key], Math.round(number));
	return Math.max(MINIMUM[key] || 0, Math.min(MAXIMUM[key] || Infinity, Math.round(number * 1000) / 1000));
}

// Starting looks E to H for each class: male light, female light, male dark, female dark
const CLASS_LOOKS = {
	warrior: [
		["marmor3f", { hair: "hairdo417", hat: "hat300", chin: "beard100", head: "makeup117" }],
		["marmor3e", { hair: "hairdo208", hat: "hat300", head: "fmakeup01" }],
		["marmor3f", { hair: "hairdo417", hat: "hat300", chin: "beard100", head: "mmakeup02" }],
		["marmor3e", { hair: "hairdo208", hat: "hat300", head: "fmakeup03" }],
	],
	paladin: [
		["mbody3c", { hair: "hairdo320", head: "makeup117" }],
		["mbody3c", { hair: "hairdo408", head: "fmakeup01" }],
		["mbody3c", { hair: "hairdo320", head: "mmakeup02" }],
		["mbody3c", { hair: "hairdo408", head: "fmakeup03" }],
	],
	priest: [
		["mbody4g", { hat: "hat302", head: "makeup117" }],
		["mabw", { hat: "hat203", head: "fmakeup01" }],
		["mbody4g", { hat: "hat302", head: "mmakeup02" }],
		["mabw", { hat: "hat203", head: "fmakeup03" }],
	],
	mage: [
		["mbody5h", { hair: "hairdo111", hat: "hat102", chin: "beard104", head: "makeup117" }],
		["mbody5c", { hair: "hairdo405", hat: "hat102", head: "fmakeup01" }],
		["mbody5h", { hair: "hairdo111", hat: "hat102", chin: "beard104", head: "mmakeup02" }],
		["mbody5c", { hair: "hairdo405", hat: "hat102", head: "fmakeup03" }],
	],
	rogue: [
		["marmor3c", { hat: "hat207", chin: "beard110", head: "makeup117" }],
		["marmor3c", { hair: "hairdo511", chin: "beard110", head: "fmakeup01" }],
		["marmor3c", { hat: "hat207", chin: "beard110", head: "mmakeup02" }],
		["marmor3c", { hair: "hairdo511", chin: "beard110", head: "fmakeup03" }],
	],
	ranger: [
		["marmor8f", { hair: "hairdo105", hat: "hat106g", chin: "beard109", head: "makeup117" }],
		["marmor8g", { hair: "hairdo208", hat: "hat106g", head: "fmakeup01" }],
		["marmor8f", { hair: "hairdo105", hat: "hat106g", chin: "beard109", head: "mmakeup02" }],
		["marmor8g", { hair: "hairdo208", hat: "hat106g", head: "fmakeup03" }],
	],
	merchant: [
		["marmor1a", { hair: "hairdo105", hat: "hat214", chin: "beard106", face: "face101", head: "makeup117" }],
		["marmor1b", { hair: "hairdo519", hat: "hat214", head: "fmakeup01" }],
		["marmor1a", { hair: "hairdo105", hat: "hat214", chin: "beard106", face: "face101", head: "mmakeup02" }],
		["marmor1b", { hair: "hairdo519", hat: "hat214", head: "fmakeup03" }],
	],
};

// Shells are gone in single player. What cost Shells costs seashells instead, at 625 seashells for every 75 Shells,
// rounded up; Favoré's blessing is a flat 10,000
const BLESSING_SEASHELLS = 10000;
function seashell_price(shells) {
	return shells > 0 ? Math.ceil((shells * 625) / 75) : 0;
}

// Prices set by hand instead of the exchange rate
const SEASHELL_ITEM_PRICES = { cosmo0: 2410 };
function item_seashell_price(name, cash, quantity) {
	quantity = quantity || 1;
	return SEASHELL_ITEM_PRICES[name] ? SEASHELL_ITEM_PRICES[name] * quantity : seashell_price(cash * quantity);
}

// Short names are priced by hand: the exchange rate would make a 1-letter name cost more seashells than a bag
// can hold (42 slots of 9,999). Names of 5 letters or more use the exchange rate
const RENAME_SEASHELLS = { 1: 350000, 2: 150000, 3: 50000, 4: 10000 };
function rename_seashells(length, shells) {
	return RENAME_SEASHELLS[length] || seashell_price(shells);
}

// How many of an item a list of inventory slots holds
function count_items(items, name) {
	let have = 0;
	for (const item of items || []) if (item && item.name == name) have += item.q || 1;
	return have;
}

// Takes amount of an item out of a list of inventory slots (emptied slots become null).
// Returns false, changing nothing, when there aren't enough
function take_items(items, name, amount) {
	if (amount <= 0) return true;
	if (count_items(items, name) < amount) return false;
	for (let i = 0; i < items.length && amount > 0; i++) {
		const item = items[i];
		if (!item || item.name != name) continue;
		const take = Math.min(amount, item.q || 1);
		if (take == (item.q || 1)) items[i] = null;
		else item.q -= take;
		amount -= take;
	}
	return true;
}

// Removes Shells from every drop table. A table that was mostly Shells (Old Paper Money's exchange) pays the same
// value in seashells instead, so it still gives something
function strip_shell_drops(drops) {
	const walk = (node) => {
		if (Array.isArray(node) && node.length && Array.isArray(node[0])) {
			const total = node.reduce((sum, drop) => sum + (typeof drop[0] == "number" ? drop[0] : 0), 0);
			for (let i = node.length - 1; i >= 0; i--) {
				const drop = node[i];
				if (!Array.isArray(drop) || drop[1] != "shells") continue;
				if (drop[0] * 2 >= total) node[i] = [drop[0], "seashell", seashell_price(drop[2])];
				else node.splice(i, 1);
			}
			return;
		}
		if (node && typeof node == "object") for (const key of Object.keys(node)) walk(node[key]);
	};
	walk(drops);
	return drops;
}

// The starting looks offered on E to H before v19. Characters made with one are moved onto the current look for the
// same letter when the website starts (upgrade_looks), keeping any other cosmetics they have
const OLD_LOOKS = {
	warrior: [
		["marmor6g", { head: "makeup104", hair: "hairdo417", chin: "beard111" }],
		["marmor6g", { head: "makeup117", hair: "hairdo417", chin: "beard111" }],
		["marmor6c", { head: "fmakeup01", hair: "hairdo519" }],
		["marmor6c", { head: "fmakeup03", hair: "hairdo519" }],
	],
	rogue: [
		["sbody1d", { head: "makeup108", hair: "hairdo415", chin: "beard112" }],
		["sbody1d", { head: "makeup117", hair: "hairdo415", chin: "beard112" }],
		["sarmor1g", { head: "fmakeup01", hair: "hairdo600" }],
		["sarmor1g", { head: "fmakeup03", hair: "hairdo600" }],
	],
	mage: [
		["mbody1e", { head: "makeup117", hair: "hairdo111", chin: "beard104" }],
		["mbody1e", { head: "makeup105", hair: "hairdo111", chin: "beard104" }],
		["mbody5h", { head: "fmakeup01", hair: "hairdo301", hat: "hat102" }],
		["mbody5h", { head: "fmakeup03", hair: "hairdo301", hat: "hat102" }],
	],
	paladin: [
		["mbody3c", { head: "makeup105", hair: "hairdo320" }],
		["mbody3c", { head: "makeup117", hair: "hairdo320" }],
	],
	merchant: [
		["marmor11g", { head: "makeup104", hair: "hairdo105", hat: "hat213", chin: "beard109" }],
		["marmor11g", { head: "makeup117", hair: "hairdo105", hat: "hat213", chin: "beard109" }],
	],
	ranger: [
		["marmor5c", { head: "fmakeup03", hair: "hairdo208", hat: "hat221" }],
		["marmor5c", { head: "fmakeup01", hair: "hairdo208", hat: "hat221" }],
	],
	priest: [
		["mbody4g", { head: "nfmakeup06", hair: "hairdo602" }],
		["mbody4g", { head: "fmakeup01", hair: "hairdo602" }],
	],
};

// Returns the current look for a character still wearing an old E to H look, or null
function upgraded_look(type, skin, cx) {
	const old = OLD_LOOKS[type] || [];
	cx = cx && typeof cx == "object" && !Array.isArray(cx) ? cx : {};
	const index = old.findIndex(([s, parts]) => s == skin && Object.keys(parts).every((slot) => cx[slot] == parts[slot]));
	if (index < 0 || !CLASS_LOOKS[type] || !CLASS_LOOKS[type][index]) return null;
	const [new_skin, new_parts] = CLASS_LOOKS[type][index];
	const result = Object.assign({}, cx);
	for (const slot of Object.keys(old[index][1])) delete result[slot];
	return { skin: new_skin, cx: Object.assign(result, new_parts) };
}

// Moves characters made with an old E to H look onto the current look for that letter
async function upgrade_looks(db) {
	let moved = 0;
	for (const type of Object.keys(OLD_LOOKS)) {
		const characters = await db.collection("character").find({ type: type }).toArray();
		for (const character of characters) {
			const info = character.info || {};
			const look = upgraded_look(type, info.skin, info.cx);
			if (!look) continue;
			await db.collection("character").updateOne({ _id: character._id }, { $set: { "info.skin": look.skin, "info.cx": look.cx } });
			const owner = character.owner && (await db.collection("user").findOne({ _id: character.owner }));
			const list = owner && owner.info && owner.info.characters;
			if (Array.isArray(list))
				for (let i = 0; i < list.length; i++)
					if (list[i] && list[i].id == character._id)
						await db.collection("user").updateOne({ _id: owner._id }, { $set: { ["info.characters." + i + ".skin"]: look.skin, ["info.characters." + i + ".cx"]: look.cx } });
			moved++;
		}
	}
	if (moved) console.log("Single player: moved " + moved + " character(s) onto the current E to H looks");
	return moved;
}

// Adds the extra looks to the class definitions; safe to run more than once
function add_looks(classes) {
	for (const extra of [CLASS_LOOKS])
		for (const name of Object.keys(extra)) {
			const looks = classes && classes[name] && classes[name].looks;
			if (!looks) continue;
			const have = new Set(looks.map((look) => JSON.stringify(look)));
			for (const look of extra[name]) if (!have.has(JSON.stringify(look))) looks.push(JSON.parse(JSON.stringify(look)));
		}
	return classes;
}

// Guide pages about online-only services, taken out of the guide and the in-game Guide window
const REMOVED_GUIDES = ["limits", "hub", "adventure-mcp", "mainframe", "adventure-api", "pvp", "X.sub-msgpack"];
// CODE functions documented only for PvP and duels
const REMOVED_FUNCTIONS = ["get_pvp_history", "send_duel_challenge", "accept_duel_challenge", "enter_duel"];

// Takes the online-only pages out of the guide directory (docs/directory.js); safe to run more than once
function prune_docs(docs) {
	if (!docs) return docs;
	const prune = (list) =>
		list.filter((entry) => {
			if (!Array.isArray(entry)) return true;
			if (entry[0] == "limits") {
				// The online rules page becomes a single player page about characters online and slots
				entry.splice(0, 3, "characters-and-limits", "Characters & Limits", "characters online,merchants,slots,windows,limits");
				return true;
			}
			if (REMOVED_GUIDES.includes(entry[0])) return false;
			if (Array.isArray(entry[4])) entry[4] = prune(entry[4]);
			return true;
		});
	if (docs.guide) docs.guide = prune(docs.guide);
	for (const key of ["functions", "documented"])
		if (docs[key]) docs[key] = docs[key].filter((name) => !REMOVED_FUNCTIONS.includes(name));
	const interactions = docs.interactions || {};
	delete interactions.pvp; // the arena's PvP guide
	if (interactions.mainframe) interactions.mainframe.article = "special-interactions"; // Cyberland's terminal, not the hosting service
	if (interactions.server_services) {
		// Favoré's blessing costs seashells, and there are no Shells. A new key, so the online text's translations don't replace it
		interactions.sp_server_services = Object.assign({}, interactions.server_services, {
			title: "Server Blessings",
			summary: "Favoré blesses the server for three days for 10,000 seashells from your bag.",
		});
		const map = docs.interaction_map || {};
		for (const group of Object.values(map))
			if (group && typeof group == "object") for (const key of Object.keys(group)) if (group[key] == "server_services") group[key] = "sp_server_services";
	}
	for (const name of Object.keys(interactions))
		if (interactions[name].functions)
			interactions[name].functions = interactions[name].functions.filter((fn) => !REMOVED_FUNCTIONS.includes(fn));
	return docs;
}

function create(settings) {
	let base_limits = null;
	let skill_game = null;
	let base_cooldowns = {};
	return {
		settings,
		// Shells to seashells, for the game server
		BLESSING_SEASHELLS,
		seashell_price,
		item_seashell_price,
		strip_shell_drops,
		EVENT_MONSTERS,
		// Applies one setting to a value; success chances are capped at 100%
		scale(kind, value) {
			if (kind == "hp_loss" && settings.god_mode) return 0;
			if (kind in MULTIPLIERS) {
				const result = value * settings[MULTIPLIERS[kind]];
				return kind == "upgrade" || kind == "compound" ? Math.min(1, result) : result;
			}
			return value;
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
		holiday_event,
		// Which holiday events and event monsters are on
		event_state() {
			const state = { events: {}, monsters: {} };
			Object.keys(EVENT_SETTINGS).forEach((name) => (state.events[name] = !!settings[EVENT_SETTINGS[name]]));
			EVENT_MONSTERS.forEach((name) => (state.monsters[name] = !!settings["monster_" + name]));
			return state;
		},
		// Changes to the game data (G) the server and website build from the design files
		apply_game_data(G) {
			// Skill cooldowns as the design files have them, so the Mod Menu can change them while the game runs
			skill_game = G;
			base_cooldowns = {};
			for (const [name, def] of Object.entries(G.skills || {}))
				if (def && !def.monster && def.type != "monster")
					base_cooldowns[name] = { cooldown: def.cooldown, reuse_cooldown: def.reuse_cooldown };
			this.apply_cooldowns();
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
			if (G.drops) strip_shell_drops(G.drops);
			// Items bought with Shells show their seashell price
			for (const [name, def] of Object.entries(G.items || {})) if (def && def.cash) def.seashells = item_seashell_price(name, def.cash, 1);
			return G;
		},
		// A gold price in the NPC shops, Ponty or Lost and Found after Fire Sale and the Trader Discount
		shop_price(gold) {
			if (settings.fire_sale) return 0;
			const discount = Math.min(100, Math.max(0, settings.trader_discount || 0));
			return Math.round(gold * (1 - discount / 100));
		},
		// An exchange table with Exchange luck applied: every reward rarer than the table's most common one has its
		// weight multiplied by the luck, so 2 makes rare rewards twice as likely. "Nothing" results are never boosted
		luck_table(table) {
			const luck = typeof settings.exchange_luck == "number" ? settings.exchange_luck : 1;
			if (luck == 1 || !Array.isArray(table) || table.length < 2) return table;
			const most = Math.max(...table.map((drop) => drop[0]));
			return table.map((drop) => (drop[0] < most && drop[1] != "empty" ? [drop[0] * luck].concat(drop.slice(1)) : drop));
		},
		// The chance of an exchange's bonus reward with Exchange luck applied
		luck_chance(chance) {
			const luck = typeof settings.exchange_luck == "number" ? settings.exchange_luck : 1;
			return Math.min(1, chance * luck);
		},
		// How long an exchange, upgrade or compound takes with Exchange speed or Crafting speed applied: 2 = twice as fast
		speed_up(ms, key) {
			const speed = typeof settings[key] == "number" && settings[key] > 0 ? settings[key] : 1;
			return Math.max(1, Math.round(ms / speed));
		},
		// Sets every skill's cooldown from the design files' value and the Skill cooldowns setting
		apply_cooldowns() {
			if (!skill_game) return;
			const multiplier = typeof settings.skill_cooldown == "number" ? settings.skill_cooldown : 1;
			for (const [name, base] of Object.entries(base_cooldowns)) {
				const def = skill_game.skills[name];
				if (!def) continue;
				for (const key of ["cooldown", "reuse_cooldown"])
					if (typeof base[key] == "number") def[key] = Math.round(base[key] * multiplier);
				if (!settings.fishing_mining_cooldown && (name == "fishing" || name == "mining")) def.reuse_cooldown = 0;
			}
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
		// What the Mod Menu shows: its groups, each with sections and rows holding the current values.
		// changed counts the group's settings that aren't at their normal value
		mod_state() {
			return {
				groups: MOD_MENU.map((group) => {
					const rows = group.rows.map((row) =>
						typeof row == "string"
							? { section: row }
							: {
									key: row[0],
									label: row[1],
									note: row[2],
									value: settings[row[0]],
									yesno: typeof DEFAULTS[row[0]] == "boolean",
									restart: RESTART.includes(row[0]),
									button: typeof row[3] == "string" ? row[3] : undefined,
									amounts: row[0] == "give_take" ? { gold: settings.give_gold, xp: settings.give_xp } : undefined,
								},
					);
					const changed = rows.filter((row) => row.key && !NOT_COUNTED.includes(row.key) && settings[row.key] !== DEFAULTS[row.key]).length;
					return { name: group.name, note: group.note, changed, rows };
				}),
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
	CLASS_LOOKS,
	add_looks,
	BLESSING_SEASHELLS,
	seashell_price,
	item_seashell_price,
	rename_seashells,
	count_items,
	take_items,
	strip_shell_drops,
	upgraded_look,
	upgrade_looks,
	prune_docs,
	REMOVED_GUIDES,
	create: (values) => create(Object.assign({}, DEFAULTS, values)),
	load: () => create(load()),
};

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
	ponty_keep_sold_items: false,
	upgrade_success_percent: 100,
	compound_success_percent: 100,
	mp_usage_percent: 100,
	hp_loss_percent: 100,
	drop_rate_percent: 100,
	gold_drop_percent: 100,
	drop_everything: false,
	holiday_season: false,
	lunar_new_year: false,
	valentines: false,
	halloween: false,
	egg_hunt: false,
	max_characters_online: 3,
	fishing_mining_cooldown: true,
	tools_break: true,
	starting_gold: 0,
	merrit_visit_minutes: 60,
	merrit_buys_stall: false,
};

function parse(text) {
	const values = {};
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
	return values;
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
	drop: "drop_rate_percent",
	gold: "gold_drop_percent",
};

function create(settings) {
	return {
		settings,
		// Applies one percent setting to a value; success chances are capped at 100%
		scale(kind, value) {
			if (kind == "sell") return value * settings.sell_multiplier;
			const result = value * (settings[SCALES[kind]] / 100);
			return kind == "upgrade" || kind == "compound" ? Math.min(1, result) : result;
		},
		apply_events(events) {
			Object.keys(EVENT_SETTINGS).forEach((name) => set_event(events, name, settings[EVENT_SETTINGS[name]]));
		},
		// Turns a holiday event on or off while the game runs, and saves the choice to settings.txt
		toggle_event(events, name, on) {
			if (!Object.prototype.hasOwnProperty.call(EVENT_SETTINGS, name)) return false;
			set_event(events, name, on);
			settings[EVENT_SETTINGS[name]] = !!on;
			if (fs.existsSync(SETTINGS_FILE)) save_setting(SETTINGS_FILE, EVENT_SETTINGS[name], on ? "yes" : "no");
			return true;
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
			return G;
		},
		apply_options(options) {
			options.character_limit = Math.max(options.character_limit || 0, settings.max_characters_online);
			options.ip_limit = Math.max(options.ip_limit || 0, settings.max_characters_online);
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
	save_setting,
	EVENT_SETTINGS,
	create: (values) => create(Object.assign({}, DEFAULTS, values)),
	load: () => create(load()),
};

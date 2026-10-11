"use strict";

// Single player settings: reads settings.txt (copied from settings.example.txt on first run)
// and exposes the multipliers the game server applies. Kept in one file so upstream merges stay easy.

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const SETTINGS_FILE = path.join(ROOT, "settings.txt");
const EXAMPLE_FILE = path.join(ROOT, "settings.example.txt");

const DEFAULTS = {
	shop_price_percent: 100,
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

function load() {
	if (!fs.existsSync(SETTINGS_FILE) && fs.existsSync(EXAMPLE_FILE)) fs.copyFileSync(EXAMPLE_FILE, SETTINGS_FILE);
	let values = {};
	if (fs.existsSync(SETTINGS_FILE)) values = parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
	const settings = Object.assign({}, DEFAULTS, values);
	console.log("Single player settings (" + SETTINGS_FILE + "):");
	Object.keys(settings).forEach((key) => console.log("  " + key + " = " + settings[key]));
	return settings;
}

const SCALES = {
	shop: "shop_price_percent",
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
			const result = value * (settings[SCALES[kind]] / 100);
			return kind == "upgrade" || kind == "compound" ? Math.min(1, result) : result;
		},
		apply_events(events) {
			if (settings.holiday_season) events.holidayseason = true;
			if (settings.lunar_new_year) events.lunarnewyear = true;
			if (settings.valentines) events.valentines = true;
			if (settings.halloween) events.halloween = true;
			if (settings.egg_hunt && !events.egghunt) events.egghunt = 60;
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
	create: (values) => create(Object.assign({}, DEFAULTS, values)),
	load: () => create(load()),
};

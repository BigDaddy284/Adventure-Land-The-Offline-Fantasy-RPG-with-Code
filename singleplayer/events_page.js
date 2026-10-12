"use strict";

// Single player: the text of the Events page (docs/guide/events-and-home.html), one JSON file per language
// in singleplayer/events_page. Missing languages or lines fall back to English.

const fs = require("node:fs");
const path = require("node:path");

const DIR = path.join(__dirname, "events_page");
const cache = Object.create(null);

function read(language) {
	try {
		return JSON.parse(fs.readFileSync(path.join(DIR, language + ".json"), "utf8"));
	} catch (e) {
		return {};
	}
}

function text(language) {
	language = /^[a-zA-Z-]+$/.test(language || "") ? language : "en";
	if (!cache[language]) cache[language] = Object.freeze(Object.assign(read("en"), language == "en" ? {} : read(language)));
	return cache[language];
}

module.exports = { text };

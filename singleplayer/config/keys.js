const crypto = require("node:crypto");
const path = require("node:path");

// Single player: random keys are made once and saved in keys.local.json, so the website
// and the game server (separate programs) share the same keys and they survive restarts.
const fs = require("node:fs");
const saved_file = path.join(__dirname, "keys.local.json");
let saved = {};
try {
	saved = JSON.parse(fs.readFileSync(saved_file, "utf8"));
} catch (e) {}
let changed = false;
let counter = 0;
const rk = (n) => {
	const name = "key" + counter++ + "_" + n;
	if (!saved[name]) {
		saved[name] = crypto.randomBytes(n).toString("hex");
		changed = true;
	}
	return saved[name];
};

module.exports = {
	server_keyword: rk(16),
	mongodb_uri: "mongodb://127.0.0.1:27017/adventureland",
	mongodb_name: "adventureland",
	mongodb_config: {}, // e.g. { tlsCAFile: path.resolve(__dirname, "your-ca.crt") }
	stripe_test_api_key: "",
	stripe_test_pkey: "",
	stripe_api_key: "",
	stripe_pkey: "",
	steam_web_apikey: "",
	steam_publisher_web_apikey: "",
	sdk_password: rk(16),
	amazon_ses_user: "",
	amazon_ses_key: "",
	ACCESS_MASTER: rk(20),
	BOT_MASTER: rk(20),
	SERVER_MASTER: rk(16),
	discord_token: "",
	apple_token: "",
	steam_key: "",
};

if (changed) fs.writeFileSync(saved_file, JSON.stringify(saved, null, "\t"));

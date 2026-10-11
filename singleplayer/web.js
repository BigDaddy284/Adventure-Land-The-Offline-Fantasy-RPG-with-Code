"use strict";

// Single player: switches off the website parts a local single player game doesn't use
// (payments, Steam sign in and purchases, AI/MCP access, referrals and search engine pages).
// Kept out of the original files so official updates merge cleanly.

// Pages and endpoints that answer "not found"
const BLOCKED_PATHS = [
	/^\/shells(\/|$)/,
	/^\/payments(\/|$)/,
	/^\/steam-purchase/,
	/^\/steam-sign(in|up)(\/|$)/,
	/^\/steam-news(\/|$)/,
	/^\/mcp(_api)?(\/|$)/,
	/^\/r\//,
	/^\/sitemap\.xml$/,
	/^\/internal\/bots\//,
	/^\/(hub|comm)(\/|$)/, // multi-window hub for online play
];

// API calls removed from the game's API list
const BLOCKED_METHODS = [
	"stripe_payment",
	"steam_payment_start",
	"steam_payment_finish",
	"transfer_character", // moves a character to another account
	"password_reminder", // emails a password reminder
	"change_email", // the built-in account has no real email
	"change_password", // would stop the automatic login
	"logout_everywhere",
];

function block_paths(req, res, next) {
	const path = req.path || req.url.split("?")[0];
	if (BLOCKED_PATHS.some((pattern) => pattern.test(path))) return res.status(404).send("Not available in single player");
	next();
}

function restrict_api(REF) {
	BLOCKED_METHODS.forEach((method) => delete REF[method]);
}

// The one built-in account. Only reachable from this PC.
const ACCOUNT = { email: "player@adventure.local", password: "singleplayer" };

// Logs every page visit into the built-in account (creating it the first time), then reloads the page.
// get_user(req) and signup_or_login(args) are the website's own functions.
function auto_login({ get_user, signup_or_login }) {
	return async function (req, res, next) {
		// "auto_login" in the address means a login was just tried, so don't loop if the browser refused the cookie
		if (req.method != "GET" || req.path.startsWith("/api") || req.query.auto_login) return next();
		try {
			if (await get_user(req)) return next();
			res.infs = [];
			const result = await signup_or_login({ req, res, email: ACCOUNT.email, password: ACCOUNT.password });
			if (!result || result.failed) {
				console.error("Single player auto login failed:", result && result.reason);
				return next();
			}
			return res.redirect(req.originalUrl + (req.originalUrl.includes("?") ? "&" : "?") + "auto_login=1");
		} catch (e) {
			console.error("Single player auto login failed:", e);
			next();
		}
	};
}

module.exports = { BLOCKED_PATHS, BLOCKED_METHODS, ACCOUNT, block_paths, restrict_api, auto_login };

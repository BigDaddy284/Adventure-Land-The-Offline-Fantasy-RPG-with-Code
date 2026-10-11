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
];

// API calls removed from the game's API list
const BLOCKED_METHODS = [
	"stripe_payment",
	"steam_payment_start",
	"steam_payment_finish",
	"transfer_character", // moves a character to another account
	"password_reminder", // emails a password reminder
];

function block_paths(req, res, next) {
	const path = req.path || req.url.split("?")[0];
	if (BLOCKED_PATHS.some((pattern) => pattern.test(path))) return res.status(404).send("Not available in single player");
	next();
}

function restrict_api(REF) {
	BLOCKED_METHODS.forEach((method) => delete REF[method]);
}

module.exports = { BLOCKED_PATHS, BLOCKED_METHODS, block_paths, restrict_api };

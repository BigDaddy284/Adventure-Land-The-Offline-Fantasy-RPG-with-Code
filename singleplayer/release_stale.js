// Single player: lets characters log in again after a game that didn't stop cleanly (e.g. the PC restarted).
// The game's database must be running and the game itself closed. Usage: node singleplayer\release_stale.js
// Newer versions of the game do this by themselves every time they start.
const { MongoClient } = require("mongodb");
const keys = require("../secretsandconfig/keys");

(async () => {
	const client = new MongoClient(keys.mongodb_uri, { directConnection: true, serverSelectionTimeoutMS: 10000 });
	try {
		await client.connect();
		const db = client.db(keys.mongodb_name);
		const stale = { server: { $nin: [null, ""] } };
		const characters = await db.collection("character").updateMany(stale, { $set: { online: false, server: "" } });
		const users = await db.collection("user").updateMany(stale, { $set: { server: "", mounted_to: "" } });
		console.log("Released " + characters.modifiedCount + " character(s) and " + users.modifiedCount + " bank(s).");
	} catch (e) {
		console.error("Could not release the characters: " + e.message + " (is the database running?)");
		process.exitCode = 1;
	} finally {
		await client.close().catch(() => {});
	}
})();

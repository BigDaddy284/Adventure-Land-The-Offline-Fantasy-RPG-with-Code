// Single player: asks the game's database to shut down cleanly. Usage: node stop_db.js
const { MongoClient } = require("mongodb");
const keys = require("../secretsandconfig/keys");

(async () => {
	const client = new MongoClient(keys.mongodb_uri, { directConnection: true, serverSelectionTimeoutMS: 3000 });
	try {
		await client.connect();
		await client.db("admin").command({ shutdown: 1 });
	} catch (e) {
		// The connection drops as the database shuts down, and a database that isn't running is already stopped
	} finally {
		await client.close().catch(() => {});
	}
})();

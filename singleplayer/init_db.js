// Single player: turns the game's own MongoDB (port 27018) into a one-member replica set,
// which the game needs for transactions (sign in, creating characters, trades, ...).
// Safe to run every launch. Usage: node init_db.js
const { MongoClient } = require("mongodb");
const keys = require("../secretsandconfig/keys");

(async () => {
	const client = new MongoClient(keys.mongodb_uri, { directConnection: true, serverSelectionTimeoutMS: 10000 });
	try {
		await client.connect();
		const admin = client.db("admin");
		const host = client.options.hosts[0].host + ":" + client.options.hosts[0].port;
		try {
			await admin.command({ replSetGetStatus: 1 });
		} catch (e) {
			if (e.codeName != "NotYetInitialized") throw e;
			console.log("Setting up the database for the first time...");
			await admin.command({ replSetInitiate: { _id: "rs0", members: [{ _id: 0, host: host }] } });
		}
		for (let i = 0; i < 60; i++) {
			const hello = await admin.command({ hello: 1 });
			if (hello.isWritablePrimary) return console.log("Database ready");
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		throw new Error("the database did not become ready");
	} catch (e) {
		console.error("Database setup failed: " + e.message);
		process.exitCode = 1;
	} finally {
		await client.close();
	}
})();

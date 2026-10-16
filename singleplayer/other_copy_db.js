// Single player: stops a game database that is still running from another copy of the game's folder (an older version, or a game that
// was ended from Task Manager), so this copy starts its own and saves into its own folder. Usage: node other_copy_db.js
// Exits 0 when nothing needs doing (no database running, or it is this folder's own).
const net = require("node:net");
const path = require("node:path");
const { MongoClient } = require("mongodb");
const keys = require("../secretsandconfig/keys");

const ours = path.resolve(__dirname, "data").toLowerCase().replace(/[\\/]+$/, "");

function port_open() {
	return new Promise((resolve) => {
		const socket = net.connect(27018, "127.0.0.1");
		socket.on("connect", () => (socket.destroy(), resolve(true)));
		socket.on("error", () => (socket.destroy(), resolve(false)));
	});
}

(async () => {
	if (!(await port_open())) return;
	const client = new MongoClient(keys.mongodb_uri, { directConnection: true, serverSelectionTimeoutMS: 3000 });
	try {
		await client.connect();
		const options = await client.db("admin").command({ getCmdLineOpts: 1 });
		const theirs = path.resolve(String((options.parsed && options.parsed.storage && options.parsed.storage.dbPath) || "")).toLowerCase().replace(/[\\/]+$/, "");
		if (theirs == ours) return;
		console.log("Closing the database left running from another copy of the game...");
		await client.db("admin").command({ shutdown: 1 }).catch(() => {}); // a clean shutdown, so that folder's saves are kept
	} catch (e) {
		return; // can't tell whose it is: leave it alone
	} finally {
		await client.close().catch(() => {});
	}
	for (let i = 0; i < 30 && (await port_open()); i++) await new Promise((r) => setTimeout(r, 1000));
})();

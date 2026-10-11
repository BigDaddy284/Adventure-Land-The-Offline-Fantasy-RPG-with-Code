// Single player: waits until something is listening on a local port. Usage: node wait_port.js PORT SECONDS NAME
const net = require("node:net");
const [port, seconds, name] = [Number(process.argv[2]), Number(process.argv[3] || 60), process.argv[4] || "service"];
const deadline = Date.now() + seconds * 1000;
process.stdout.write("Waiting for the " + name + " ");
(function attempt() {
	const socket = net.connect(port, "127.0.0.1");
	socket.on("connect", () => {
		socket.destroy();
		console.log(" ready");
		process.exit(0);
	});
	socket.on("error", () => {
		socket.destroy();
		if (Date.now() > deadline) {
			console.log(" not ready after " + seconds + " seconds");
			process.exit(1);
		}
		process.stdout.write(".");
		setTimeout(attempt, 1000);
	});
})();

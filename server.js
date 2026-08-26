const { createServer } = require("http");
const fs = require("fs");
const path = require("path");
const next = require("next");

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}

// Hosting panel may pass `--port=3000 --host=127.x.x.x` to `npm run start`.
function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const portEnv =
  process.env.PORT || argValue("port") || "3000";
const isSocket = portEnv.includes("/") || portEnv.endsWith(".sock");
const port = isSocket ? portEnv : parseInt(portEnv, 10);
const hostname =
  process.env.HOST ||
  process.env.HOSTNAME ||
  argValue("host") ||
  "127.0.0.1";
const dev = process.env.NODE_ENV !== "production";
const dir = __dirname;

if (!dev && !fs.existsSync(path.join(dir, ".next"))) {
  console.error("Немає збірки. Спочатку виконайте: npm run build");
  process.exit(1);
}

const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(...(isSocket ? [port] : [port, hostname]), () => {
      console.log(
        isSocket
          ? `> Ready on socket ${port} (${process.env.NODE_ENV})`
          : `> Ready on http://${hostname}:${port} (${process.env.NODE_ENV})`
      );
    });
});

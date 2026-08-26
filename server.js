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

const portEnv = process.env.PORT || argValue("port") || "3000";
const isSocket = portEnv.includes("/") || portEnv.endsWith(".sock");
const port = isSocket ? portEnv : parseInt(portEnv, 10);
const hostname =
  process.env.HOST ||
  process.env.HOSTNAME ||
  argValue("host") ||
  "127.0.0.1";
const dev = process.env.NODE_ENV !== "production";
const dir = __dirname;

const MAX_INFLIGHT = Number(process.env.MAX_INFLIGHT || 80);
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 64 * 1024);

const BLOCKED_PATH =
  /(?:^|\/)(?:\.env(?:\..*)?|\.git(?:\/|$)|\.svn|\.hg|wp-admin|wp-login\.php|xmlrpc\.php|phpmyadmin|adminer|cgi-bin|vendor\/phpunit|actuator|debug\/default|server-status)(?:\/|$)/i;
const BLOCKED_EXT =
  /\.(?:php|phtml|asp|aspx|jsp|cgi|exe|bat|cmd|sh|bash|py|pl|rb)(?:\/|$|\?)/i;
const BLOCKED_NAME =
  /(?:^|\/)(?:\.htaccess|\.htpasswd|web\.config|composer\.(?:json|lock)|id_rsa|id_dsa|\.DS_Store)(?:\/|$)/i;

function isBlockedUrl(url) {
  const pathname = (url || "/").split("?")[0] || "/";
  return (
    pathname.includes("..") ||
    BLOCKED_PATH.test(pathname) ||
    BLOCKED_EXT.test(pathname) ||
    BLOCKED_NAME.test(pathname)
  );
}

function sendText(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(body);
}

if (!dev && !fs.existsSync(path.join(dir, ".next"))) {
  console.error("Немає збірки. Спочатку виконайте: npm run build");
  process.exit(1);
}

const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

let inflight = 0;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const method = req.method || "GET";
    const url = req.url || "/";

    if (isBlockedUrl(url)) {
      sendText(res, 404, "Not Found");
      return;
    }

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const length = Number(req.headers["content-length"] || 0);
      if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
        sendText(res, 413, "Payload Too Large");
        return;
      }
    }

    if (inflight >= MAX_INFLIGHT) {
      res.setHeader("Retry-After", "5");
      sendText(res, 503, "Service Unavailable");
      return;
    }

    inflight += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      inflight = Math.max(0, inflight - 1);
    };
    res.on("finish", release);
    res.on("close", release);

    handle(req, res);
  });

  server.requestTimeout = 30_000;
  server.headersTimeout = 20_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 50;

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(...(isSocket ? [port] : [port, hostname]), () => {
    console.log(
      isSocket
        ? `> Ready on socket ${port} (${process.env.NODE_ENV})`
        : `> Ready on http://${hostname}:${port} (${process.env.NODE_ENV})`,
    );
  });
});

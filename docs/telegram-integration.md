# Telegram integration: TG-001 and TG-002

The webhook-compatible integration uses this boundary:

Telegram -> `/api/telegram/webhook` -> `src/modules/telegram` application service -> existing `src/lib/db/mysql` connection -> MySQL.

Telegram never connects directly to MySQL. The Next.js process does not run a long-lived bot. Only private `/start` messages are handled. Other updates are acknowledged without a reply.

An authenticated user creates a link from `/account`. A 32-byte random token is returned in a Telegram deep link; only its SHA-256 hash is stored. Creating a new link invalidates earlier unused links for that user. The link expires after ten minutes. The webhook validates the secret header, the `/start` payload and Telegram identity, then locks the token and user rows and atomically inserts the unique Telegram account link and consumes the token. Reuse, expiry, a banned user, or an identity already linked to any account fails with a generic user-facing message. Passwords are never sent through Telegram.

The schema is represented by `scripts/sql/035_telegram_account_linking.sql` and is also lazily created using the existing database pattern. Deployers must set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, and `TELEGRAM_WEBHOOK_SECRET` in the server environment, apply or allow creation of the schema, and register the public HTTPS webhook URL `https://<host>/api/telegram/webhook` with Telegram using the same secret token. The webhook token must remain server-side. Do not use the production database for local verification.

Later increments remain out of scope: TG-003 Tasks API, TG-004 `/tasks` and `/today`, TG-005 task completion, TG-006 progress, TG-007 notifications, TG-008 reminders, and TG-009 teacher/admin task assignment. The current link is one-to-one; changing or disconnecting it requires a separate authenticated workflow.

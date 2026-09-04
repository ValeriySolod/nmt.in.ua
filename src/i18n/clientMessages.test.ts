import assert from "node:assert/strict";
import test from "node:test";

import uk from "../../messages/uk.json";
import { CLIENT_MESSAGE_NAMESPACES, pickClientMessages } from "./clientMessages";

test("pickClientMessages keeps Header.goHomeShort for the cabinet client tree", () => {
  const picked = pickClientMessages(uk);

  assert.equal(
    (picked.Header as { goHomeShort: string }).goHomeShort,
    "Головна",
  );
  assert.ok(
    CLIENT_MESSAGE_NAMESPACES.every((key) => key in picked),
    "every client namespace must be present",
  );
  assert.equal("WelcomeLanding" in picked, false);
  assert.equal("Metadata" in picked, false);
});

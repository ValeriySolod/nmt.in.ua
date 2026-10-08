import assert from "node:assert/strict";
import test from "node:test";
import { loomEmbedSrc, renderSafeMarkdown, youtubeEmbedSrc } from "./richText";

test("markdown escapes html and keeps a small safe subset", () => {
  const html = renderSafeMarkdown(
    "**<script>alert(1)</script>**\n\n- [сайт](https://nmt.in.ua)\n- *курсив*",
  );
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /<strong>&lt;script&gt;/);
  assert.match(html, /href="https:\/\/nmt\.in\.ua"/);
  assert.match(html, /<em>курсив<\/em>/);
});

test("video embeds accept only YouTube and Loom ids", () => {
  assert.equal(
    youtubeEmbedSrc("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(
    youtubeEmbedSrc("https://youtu.be/dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(youtubeEmbedSrc("https://evil.example/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(
    loomEmbedSrc("https://www.loom.com/share/abcdef1234567890"),
    "https://www.loom.com/embed/abcdef1234567890",
  );
  assert.equal(loomEmbedSrc("https://loom.com.evil/share/abcdef1234567890"), null);
});

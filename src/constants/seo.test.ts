import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_OG_IMAGE_PATH,
  absoluteUrl,
  createPageMetadata,
} from "./seo";

test("createPageMetadata includes canonical, OG image, and twitter card", () => {
  const meta = createPageMetadata({
    title: "Результати за темами",
    description: "Прогрес по темах НМТ.",
    path: "/results",
  });

  assert.equal(meta.alternates?.canonical, absoluteUrl("/results"));

  const og = meta.openGraph;
  assert.ok(og && typeof og === "object" && !Array.isArray(og));
  if (og && typeof og === "object" && !Array.isArray(og)) {
    assert.equal(og.locale, "uk_UA");
    const images = og.images;
    assert.ok(Array.isArray(images) && images.length > 0);
    const first = images[0];
    assert.equal(
      typeof first === "object" && first !== null && "url" in first
        ? first.url
        : first,
      DEFAULT_OG_IMAGE_PATH,
    );
  }

  const twitter = meta.twitter;
  assert.ok(twitter && typeof twitter === "object" && !Array.isArray(twitter));
  if (twitter && typeof twitter === "object" && !Array.isArray(twitter)) {
    assert.equal(
      "card" in twitter ? twitter.card : undefined,
      "summary_large_image",
    );
  }
});

test("createPageMetadata sets noIndex for private routes", () => {
  const meta = createPageMetadata({
    title: "Сесія",
    description: "Приватна сесія.",
    path: "/session/1",
    noIndex: true,
  });

  const robots = meta.robots;
  assert.ok(robots && typeof robots === "object" && !Array.isArray(robots));
  if (robots && typeof robots === "object" && !Array.isArray(robots)) {
    assert.equal(robots.index, false);
    assert.equal(robots.follow, false);
  }
});

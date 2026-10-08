import assert from "node:assert/strict";
import test from "node:test";
import {
  loginCandidatesFromEmail,
  normalizeCtaUrl,
  parseUtmSource,
  readUtm,
  serializeUtm,
  toCsv,
} from "./utm";

test("utm keeps only known params and reads the source back", () => {
  const utm = readUtm({
    utm_source: " ads ",
    utm_medium: "cpc",
    evil: "no",
  });
  assert.deepEqual(utm, { utm_source: "ads", utm_medium: "cpc" });
  assert.equal(parseUtmSource(serializeUtm(utm)), "ads");
  assert.equal(parseUtmSource(null), null);
});

test("cta url allows site paths and http(s) only", () => {
  assert.equal(normalizeCtaUrl("/consultations"), "/consultations");
  assert.equal(normalizeCtaUrl("https://nmt.in.ua/simulator"), "https://nmt.in.ua/simulator");
  assert.equal(normalizeCtaUrl("javascript:alert(1)"), null);
  assert.equal(normalizeCtaUrl("//evil.example"), null);
});

test("login is derived from the email local part", () => {
  assert.equal(loginCandidatesFromEmail("Anna.K@Example.com")[0], "annak");
  assert.equal(loginCandidatesFromEmail("a@example.com")[0], "ua0");
  assert.equal(loginCandidatesFromEmail("annak@example.com")[1], "annak2");
});

test("csv neutralizes spreadsheet formulas", () => {
  const csv = toCsv([
    ["name", "score"],
    ["=cmd", "10"],
  ]);
  assert.match(csv, /'=cmd/);
});

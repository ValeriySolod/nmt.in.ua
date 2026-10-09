import assert from "node:assert/strict";
import test from "node:test";

import { ADMIN_NAV_HREFS } from "@/modules/auth/types";
import {
  isMarathonOnlyStudent,
  marathonOnlyMayOpen,
  marathonOnlyRedirectTarget,
  visibleSidebar,
} from "./access";

const MAP = "/marathon/math-5/map";

test("marathon-only student menu is a single marathon link", () => {
  const links = visibleSidebar({
    role: "student",
    cabinetScope: "marathon",
    marathonHref: MAP,
  });
  assert.deepEqual(
    links.map((item) => item.href),
    [MAP],
  );
  assert.equal(links[0]?.labelKey, "marathon");
});

test("marathon-only student without a marathon has no cabinet sections", () => {
  assert.deepEqual(
    visibleSidebar({
      role: "student",
      cabinetScope: "marathon",
      marathonHref: null,
    }),
    [],
  );
});

test("a platform student sees the marathon item beside the usual sections", () => {
  const links = visibleSidebar({
    role: "student",
    cabinetScope: "full",
    marathonHref: MAP,
  });
  const hrefs = links.map((item) => item.href);
  assert.ok(hrefs.includes("/"));
  assert.ok(hrefs.includes("/results"));
  assert.ok(hrefs.includes("/simulator"));
  assert.ok(hrefs.includes(MAP));
  assert.equal(hrefs.filter((href) => href === MAP).length, 1);
  assert.ok(!hrefs.includes("/admin/marathons"));
  assert.ok(!hrefs.includes("/assign"));
});

test("a platform student without a joined marathon does not see the item", () => {
  const hrefs = visibleSidebar({
    role: "student",
    cabinetScope: "full",
    marathonHref: null,
  }).map((item) => item.href);
  assert.ok(!hrefs.some((href) => href.startsWith("/marathon/")));
  assert.ok(hrefs.includes("/results"));
});

test("teachers and admins keep their menus when a marathon href is present", () => {
  const teacher = visibleSidebar({
    role: "teacher",
    cabinetScope: "marathon",
    marathonHref: MAP,
  }).map((item) => item.href);
  assert.ok(teacher.includes("/assign"));
  assert.ok(teacher.includes("/students"));
  assert.ok(!teacher.includes("/"));
  assert.ok(!teacher.includes(MAP));

  const admin = visibleSidebar({
    role: "admin",
    cabinetScope: "marathon",
    marathonHref: MAP,
  }).map((item) => item.href);
  assert.deepEqual([...admin].sort(), [...ADMIN_NAV_HREFS].sort());
  assert.equal(isMarathonOnlyStudent("teacher", "marathon"), false);
  assert.equal(isMarathonOnlyStudent("admin", "marathon"), false);
  assert.equal(isMarathonOnlyStudent("student", "full"), false);
  assert.equal(isMarathonOnlyStudent("student", "marathon"), true);
});

test("marathon-only direct URLs redirect to the map, profile and marathon stay", () => {
  assert.equal(marathonOnlyRedirectTarget("/results", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/simulator", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/materials/textbook", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/sessions", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/consultations", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/leaderboard", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/join/ABCD", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/practice/fractions", MAP), MAP);
  assert.equal(marathonOnlyRedirectTarget("/account", MAP), null);
  assert.equal(marathonOnlyRedirectTarget("/account/password", MAP), null);
  assert.equal(marathonOnlyRedirectTarget("/marathon/math-5/day/2", MAP), null);
  assert.equal(marathonOnlyRedirectTarget(MAP, MAP), null);
  assert.equal(marathonOnlyMayOpen("/marathon/math-5/final"), true);
  assert.equal(marathonOnlyRedirectTarget("/results", null), "/account");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { getCountryIdFromQuery } from "../util/getCountryIdFromQuery.js";

test("returns ISO code for nigeria (static map)", async () => {
  const result = await getCountryIdFromQuery("nigeria");
  assert.equal(result, "NG");
});

test("returns ISO code for united states (static map)", async () => {
  const result = await getCountryIdFromQuery("from the united states");
  assert.equal(result, "US");
});

test("returns ISO code for usa abbreviation (static map)", async () => {
  const result = await getCountryIdFromQuery("usa");
  assert.equal(result, "US");
});

test("returns ISO code for uk alias (static map)", async () => {
  const result = await getCountryIdFromQuery("uk");
  assert.equal(result, "GB");
});

test("returns ISO code for germany (static map)", async () => {
  const result = await getCountryIdFromQuery("germany");
  assert.equal(result, "DE");
});

test("returns null or string for unrecognised query", async () => {
  const result = await getCountryIdFromQuery("zzzyyyxxx999");
  assert.ok(result === null || typeof result === "string");
});

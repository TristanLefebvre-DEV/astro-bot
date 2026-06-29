import test from "node:test";
import assert from "node:assert/strict";
import { parseDurationToMs } from "../src/modules/moderation/moderationService.js";
import { redactSensitiveContent } from "../src/utils/redaction.js";
import { parseTemplate } from "../src/modules/backup/backupService.js";
import { guildConfigPatchSchema } from "../src/modules/validation/schemas.js";

test("parseDurationToMs parses supported units", () => {
  assert.equal(parseDurationToMs("10s"), 10_000);
  assert.equal(parseDurationToMs("5m"), 300_000);
  assert.equal(parseDurationToMs("2h"), 7_200_000);
  assert.equal(parseDurationToMs("7d"), 604_800_000);
  assert.equal(parseDurationToMs("2w"), 1_209_600_000);
});

test("parseDurationToMs rejects invalid duration", () => {
  assert.equal(parseDurationToMs("abc"), null);
  assert.equal(parseDurationToMs("10x"), null);
});

test("redactSensitiveContent hides sensitive values", () => {
  const redacted = redactSensitiveContent("mail test@example.com phone +33 6 12 34 56 78");
  assert.match(redacted, /\[redacted]/);
  assert.doesNotMatch(redacted, /test@example\.com/);
});

test("parseTemplate validates serverbuilder JSON", () => {
  const template = parseTemplate(
    JSON.stringify({
      name: "Test",
      roles: [{ name: "Member", color: "#22c55e", permissions: [] }],
      categories: [{ name: "Accueil", channels: [{ name: "general", type: "text" }] }]
    })
  );
  assert.equal(template.roles?.[0]?.name, "Member");
});

test("parseTemplate rejects invalid channel type", () => {
  assert.throws(() =>
    parseTemplate(JSON.stringify({ categories: [{ name: "x", channels: [{ name: "bad", type: "forum" }] }] }))
  );
});

test("guildConfigPatchSchema rejects unknown top-level keys", () => {
  assert.equal(guildConfigPatchSchema.safeParse({ language: "fr" }).success, true);
  assert.equal(guildConfigPatchSchema.safeParse({ token: "nope" }).success, false);
});

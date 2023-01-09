import test from "ava";
import { join } from "path";
import { writeFileSync } from "fs";
import { resolver } from "../../dist/index.js";

const __dirname = new URL(".", import.meta.url).pathname;

test.serial("Generate correct dependency tree", async (t) => {
  t.timeout(100000);
  const deps = await resolver(join(__dirname, "fixtures", "package.json"));
  const expectedSize = 1107;
  writeFileSync(
    join(__dirname, "fixtures", "expected.json"),
    JSON.stringify(Object.fromEntries(deps), null, 2)
  );
  t.is(deps.size, expectedSize);
  const nextOptional = deps.get("@next/swc-linux-x64-musl");
  t.true(!!nextOptional["13.1.1"]);
  t.is(nextOptional["13.1.1"].optional, true);
  t.is(nextOptional["13.1.1"].parent[0], "node_modules/next");
});

test.serial("SemVer has more than 3 versions", async (t) => {
  const deps = await resolver(join(__dirname, "fixtures", "package.json"));
  const semver = deps.get("semver");
  t.true(Object.keys(semver).length > 3);
});

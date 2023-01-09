import "@ultrapkg/globals";
import { DependencyLinker } from "../../dist/index.js";
import { join } from "path";
import { writeFileSync, readdirSync } from "fs";
import { rm } from "fs/promises";
import test from "ava";
import { resolver } from "@ultrapkg/dependency-resolver";
import { readPackage } from "@ultrapkg/read-package";
import { satisfies } from "semver";
import { exec, execSync } from "child_process";

const __dirname = new URL(".", import.meta.url).pathname;

test.before(async (t) => {
  t.timeout(Infinity);
  const deps = await resolver(
    join(__dirname, "fixtures", "vite-project", "package.json")
  );
  // Remove node_modules
  await rm(join(__dirname, "fixtures", "vite-project", "node_modules"), {
    recursive: true,
    force: true,
  });
  t.context.deps = deps;
});

test.serial("Create correct binaries", async (t) => {
  t.timeout(Infinity);
  const deps = t.context.deps;
  const linker = new DependencyLinker({
    cwd: join(__dirname, "fixtures", "vite-project"),
  });
  await linker.link(deps);

  const expectedBinaries = [
    "esbuild",
    "loose-envify",
    "nanoid",
    "resolve",
    "rollup",
    "tsc",
    "tsserver",
    "vite",
  ];
  const binaries = readdirSync(
    join(__dirname, "fixtures", "vite-project", "node_modules", ".bin")
  );

  t.deepEqual(binaries, expectedBinaries);
});

test.serial("React version should be ^18", async (t) => {
  t.timeout(Infinity);

  const reactVersion = readPackage(
    join(
      __dirname,
      "fixtures",
      "vite-project",
      "node_modules",
      "react",
      "package.json"
    )
  );

  t.true(satisfies(reactVersion.version, "^18"));
});

test.serial("npm run build should work", async (t) => {
  t.timeout(Infinity);
  execSync("npm run build", {
    cwd: join(__dirname, "fixtures", "vite-project"),
  });

  t.pass();
});

test.serial("generate correct alotta project", async (t) => {
  t.timeout(Infinity);
  const deps = await resolver(
    join(__dirname, "fixtures", "alotta", "package.json")
  );
  // Remove node_modules
  await rm(join(__dirname, "fixtures", "alotta", "node_modules"), {
    recursive: true,
    force: true,
  });
  const linker = new DependencyLinker({
    cwd: join(__dirname, "fixtures", "alotta"),
  });

  await linker.link(deps).then(() => {
    t.pass();
  });
});

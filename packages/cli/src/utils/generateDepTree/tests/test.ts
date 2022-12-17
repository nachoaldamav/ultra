import { __dirname } from "../../__dirname.js";
import { genDepTree } from "../genDepTree.js";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const depTree = await genDepTree("sample.json");
  writeFileSync(
    join(__dirname, "depTree.json"),
    JSON.stringify(depTree, null, 2)
  );
}

main();

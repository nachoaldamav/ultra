import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import os from "node:os";

type Return = {
  [key: string]: string;
};

export function readNpmConfig(): Return {
  const npmConfig = getUsableFile();
  try {
    const data = readFileSync(npmConfig, "utf8");
    return parseNpmrc(data);
  } catch (error) {
    return {};
  }
}

function parseNpmrc(data: string) {
  const config: Return = data.split("\n").reduce((acc, line) => {
    if (line.startsWith("#") || line.startsWith(";")) return { ...acc };
    const [key, value] = line.split("=");
    if (!value) return { ...acc };
    return { ...acc, [key]: value };
  }, {});

  return config;
}

function getUsableFile() {
  const userPath = resolve(os.homedir(), ".npmrc");

  if (existsSync(resolve(process.cwd(), ".npmrc"))) {
    return resolve(process.cwd(), ".npmrc");
  } else {
    return userPath;
  }
}

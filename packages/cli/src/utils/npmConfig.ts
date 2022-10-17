import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Return = {
  [key: string]: string;
};

export function readNpmConfig(): Return {
  const npmConfig = resolve(process.cwd(), ".npmrc");
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

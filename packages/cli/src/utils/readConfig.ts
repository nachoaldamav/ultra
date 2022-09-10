import os from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const BASIC_CONFIG = {
  registry: "https://registry.npmjs.org/",
  cache: path.join(os.homedir(), ".snpm-cache"),
};

export default function readConfig() {
  const configPath = `${os.homedir()}/.snpm/.snpmrc`;
  const workspaceConfigPath = `${process.cwd()}/.snpmrc`;

  if (existsSync(workspaceConfigPath)) {
    return JSON.parse(readFileSync(workspaceConfigPath, "utf8"));
  }

  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(BASIC_CONFIG, null, 2));
  }

  return JSON.parse(readFileSync(configPath, "utf-8"));
}

export function update(params: string[]) {
  const configPath = `${os.homedir()}/.snpm/.snpmrc`;
  const config = readConfig();

  const [key, value] = params;
  config[key] = value;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

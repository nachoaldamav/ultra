import os from "os";
import path from "path";
import readConfig from "../readConfig.js";
import { readNpmConfig } from "../npmConfig.js";
import { getSuitableVersion } from "./getSuitableVersion.js";

const cacheFolder = path.join(os.homedir(), ".ultra", "__manifests__");

const token = readConfig().token;
const registry = readConfig().registry || "https://registry.npmjs.org";
const npmrc = readNpmConfig();

const specialChars = ["^", "~", ">", "<", "=", "|", "&", "*"];

export default async function manifestFetcher(spec: string, props?: any) {
  // Remove spaces "|", ">" and "<" from the spec
  const sanitizedSpec = spec
    .replace(/\|/g, "7C")
    .replace(/>/g, "3E")
    .replace(/</g, "3C");

  const getName = () => {
    if (spec.startsWith("@")) {
      return "@" + spec.split("@")[1];
    } else {
      return spec.split("@")[0];
    }
  };

  const getVersion = () => {
    const version = spec.split("@")[1];

    if (version) {
      return version;
    } else {
      return "latest";
    }
  };

  const name = getName();
  const version = getVersion();

  const file = path.join(cacheFolder, `${sanitizedSpec}.json`);

  const manifest = await fetcher(name, version);

  return manifest;
}

async function fetcher(name: string, version: string) {
  const org = name.startsWith("@") ? name.split("/")[0] : null;

  const npmRegistry =
    (org ? npmrc[`${org}:registry`] : npmrc.registry) || registry;

  const parseRegistry = npmRegistry
    ? npmRegistry.replace(/https?:\/\//, "")
    : "";

  const npmToken = org
    ? npmrc[`//${parseRegistry}:_authToken`]
    : npmrc._authToken || token;

  const fullManifest: any = await fetch(`${npmRegistry}/${name}`, {
    headers: {
      Accept:
        "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*",
      "User-Agent": "npm/7.20.3 node/v16.6.1 linux x64",
      "keep-alive": "timeout=5, max=1000",
      Authorization: `Bearer ${npmToken}`,
    },
  }).then((res) => res.json());

  const versionsObject = fullManifest["versions"];
  const versions = Object.keys(versionsObject);

  const suitableVersion = getSuitableVersion(versions, version);

  const manifest = fullManifest.versions[suitableVersion];

  return manifest;
}

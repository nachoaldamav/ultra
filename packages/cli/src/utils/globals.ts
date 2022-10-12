import readConfig from "./readConfig.js";

const Config = readConfig();

export function globals() {
  global.downloadFile = ".ultra";
  global.__DOWNLOADING = [];
  global.__DOWNLOADED = [];
  global.__SKIPPED = [];
  global.__INSTALLED = [];
  global.pkgs = [];
  global.__EXTRACTED = {};
  global.userUltraCache = Config.cache;
  global.REGISTRY = Config.registry;
  return;
}

import readConfig from "./readConfig.js";

const Config = readConfig();

(() => {
  global.downloadFile = ".ultra";
  global.__DOWNLOADING = [];
  global.__DOWNLOADED = [];
  global.__SKIPPED = [];
  global.__INSTALLED = [];
  global.pkgs = [];
  global.__EXTRACTED = {};
  global.__VERIFIED = [];
  global.__POSTSCRIPTS = [];
  global.__NOPOSTSCRIPTS = false;
  global.userUltraCache = Config.cache;
  global.REGISTRY = Config.registry;
  return;
})();

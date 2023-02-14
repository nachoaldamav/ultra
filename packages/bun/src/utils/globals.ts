import { familySync } from 'detect-libc';
import readConfig from './readConfig.js';

const Config = readConfig();
const libc = familySync();

(() => {
  global.downloadFile = '.ultra';
  global.__DOWNLOADING = [];
  global.__DOWNLOADED = [];
  global.__SKIPPED = [];
  global.__INSTALLED = [];
  global.__EXTRACTED = {};
  global.__VERIFIED = [];
  global.__POSTSCRIPTS = [];
  global.__NOPOSTSCRIPTS = false;
  global.__DIRS = {};
  global.pkgs = [];
  global.libc = libc;
  global.userUltraCache = Config.cache;
  global.REGISTRY = Config.registry;
  return;
})();

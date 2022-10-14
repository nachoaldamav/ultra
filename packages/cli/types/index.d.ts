import type { pkg } from "./pkg";

type __INSTALLED_TYPE = {
  name: string;
  version: string;
}[];

type __EXTRACTED_TYPE = {
  [key: string]: {
    name: string;
    version: string;
  };
};

declare global {
  var downloadFile: string;
  var __DOWNLOADING: string[];
  var __DOWNLOADED: any[];
  var __SKIPPED: string[];
  var __INSTALLED: __INSTALLED_TYPE;
  var __EXTRACTED: __EXTRACTED_TYPE;
  var __VERIFIED: string[];
  var pkgs: pkg[];
  var userUltraCache: string;
  var REGISTRY: string;
}

export {};

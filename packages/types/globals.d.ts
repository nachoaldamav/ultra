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

type __POSTSCRIPTS_TYPE = {
  package: string;
  script: string;
  scriptPath: string;
  cachePath: string;
};

type __DIRS_TYPE = {
  [key: string]: {
    name: string;
    version: string | undefined;
    spec: string;
    cachePath: string | undefined;
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
  var __POSTSCRIPTS: __POSTSCRIPTS_TYPE[];
  var __NOPOSTSCRIPTS: boolean;
  var __DIRS: __DIRS_TYPE;
  var libc: string | null;
  var pkgs: pkg[];
  var userUltraCache: string;
  var REGISTRY: string;
}

export {};

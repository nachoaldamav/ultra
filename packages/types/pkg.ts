export type ultra_lock = {
  [key: string]: {
    [key: string]: {
      path: string;
      cache: string;
      tarball: string;
      integrity: string;
      optional?: boolean;
    };
  };
};

export type pkg = {
  name: string;
  version: string;
  parent?: string;
  optional?: boolean;
  fromMonorepo?: string;
};

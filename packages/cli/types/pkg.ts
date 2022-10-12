export type ultra_lock = {
  [key: string]: {
    [key: string]: {
      path: string;
      cache: string;
      tarball: string;
    };
  };
};

export type pkg = {
  name: string;
  version: string;
  parent?: string;
  fromMonorepo?: string;
};

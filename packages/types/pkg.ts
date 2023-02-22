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

export type Dep = {
  [key: string]: {
    spec: string;
    parent?: string[] | undefined;
    optional?: boolean | undefined;
    path: string;
    type: DependencyType;
    tarball?: string | undefined;
    sha?: string | undefined;
  };
};

enum DependencyType {
  REGULAR = 'regular',
  DEV = 'dev',
  PEER = 'peer',
  OPTIONAL = 'optional',
}

export type depCache = Map<string, Dep>;

export type NPM_Info = {
  name: string;
  latest: string;
  versions: {
    [version: string]: {
      name: string;
      version: string;
      main: string;
      module: string;
      types: string;
      repository: {
        type: string;
        url: string;
      };
      scripts: {
        [script: string]: string;
      };
      dependencies: {
        [dependency: string]: string;
      };
      devDependencies: {
        [dependency: string]: string;
      };
      dist: {
        tarball: string;
      };
    };
  };
};

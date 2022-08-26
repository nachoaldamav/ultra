export function modifyTarballs(data: Package) {
  // Modify all tarballs to point from https://registry.npmjs.org/{package}/-/{package}-{version}.tgz to snpm-edge.snpm.workers.dev/download/{package}?v={version}
  for (const version of Object.keys(data.versions)) {
    const tarball = data.versions[version].dist.tarball;
    data.versions[version].dist.tarball = tarball.replace(
      "https://registry.npmjs.org",
      "https://snpm-edge.snpm.workers.dev/download"
    );
  }

  return data;
}

type Package = {
  name: string;
  "dist-tags": {
    latest: string;
  };
  versions: {
    [version: string]: {
      dist: {
        tarball: string;
      };
    };
  };
};

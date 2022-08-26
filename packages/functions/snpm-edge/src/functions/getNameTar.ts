// Get dep name, version and filename from "http://localhost:8787/download/cross-spawn/-/cross-spawn-0.0.2.tgz"

export function getName(dep: string) {
  //@ts-ignore-next-line
  const [, dependency, , filename] = dep.match(
    /\/download\/(.*?)\/(.*?)\/(.*?)$/
  );
  return {
    dependency,
    version: getVersion(filename),
    filename,
  };
}

function getVersion(filename: string) {
  const splitted = filename.split("-");
  const version = splitted[splitted.length - 1].replace(".tgz", "");
  return version;
}

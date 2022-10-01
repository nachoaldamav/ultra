// Get dep name, version and filename from "http://localhost:8787/download/cross-spawn/-/cross-spawn-0.0.2.tgz"

export function getName(dep: string) {
  // @ts-ignore-next-line
  const [, , , filename] = dep.match(/\/download\/(.*?)\/(.*?)\/(.*?)$/);

  return {
    dependency: dep.split("/download/")[1].split("/-/")[0],
    version: getVersion(filename),
    filename: getFilename(filename),
  };
}

function getVersion(filename: string) {
  const splitted = filename.split("-");
  const version = splitted[splitted.length - 1].replace(".tgz", "");
  return version;
}

function getFilename(filename: string) {
  const splitted = filename.split("/");

  return splitted.length > 1 ? splitted[1] : filename;
}

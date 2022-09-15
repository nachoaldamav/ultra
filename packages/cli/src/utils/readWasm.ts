import wasm from "wasm_links";

export default function readWasm(path: string): Array<{
  name: string;
  version: string;
  path: string;
  tarball: string;
}> {
  return JSON.parse(wasm.read_snpm_file(path));
}

import axios from "axios";
import { clearName } from "./clearName.js";

export default async function betterOptions(pkg: string) {
  const name = clearName(pkg);
  const res = await axios.get(
    `https://bundlephobia.com/api/similar-packages?package=${name}`
  );
  const json = res.data;

  if (json.category.similar.length > 0 && json.category.score > 10) {
    return json.category.similar;
  }

  return [];
}

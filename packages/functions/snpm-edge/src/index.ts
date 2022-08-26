/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { fetchPackage } from "./handler";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Get path from request
    const url = new URL(request.url);
    const path = url.pathname;
    const hasQuery = path.includes("?");

    if (path.startsWith("/package/")) {
      const packageName = hasQuery ? path.split("?")[0] : path;
      const full = url.searchParams.get("full") === "true";
      const packageJson = await fetchPackage(
        packageName.replace("/package/", ""),
        full
      );
      return new Response(packageJson, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } else if (path.startsWith("/download/")) {
      const packageName = hasQuery ? path.split("?")[0] : path;
      const version = url.searchParams.get("v");

      if (!version) {
        return new Response("Missing version", {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=86400, ",
          },
        });
      }

      const packageJson = await fetchPackage(
        packageName.replace("/download/", ""),
        true
      );
      const packageJsonObject = JSON.parse(packageJson);
      const packageVersion = packageJsonObject.versions[version];
      const packageVersionPath = packageVersion.dist.tarball;
      const packageVersionResponse = await fetch(packageVersionPath);

      const encodedFilename = encodeURIComponent(
        packageVersion.name + "-" + version + ".tgz"
      );

      return new Response(packageVersionResponse.body, {
        headers: {
          "Content-Type": "application/octet-stream",
          "content-disposition": `attachment; filename*=UTF-8''${encodedFilename}; filename="${encodedFilename}"`,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, inmutable",
        },
      });
    } else {
      return new Response(`Hello World from ${path}!`);
    }
  },
};

/* eslint-disable import/no-anonymous-default-export */
import { fetchPackage } from "./fetchPackage";
import { getName } from "./functions/getNameTar";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  NPM_TAR: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext) {
    const url = new URL(request.url);
    const path = url.pathname;
    const hasQuery = path.includes("?");
    const packageName = hasQuery ? path.split("?")[0] : path;

    if (path.startsWith("/package/")) {
      const full = url.searchParams.get("full") === "true";
      const packageJson = await fetchPackage(
        packageName.replace("/package/", ""),
        full
      );
      return new Response(packageJson, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    } else if (path.startsWith("/download/")) {
      const { version, dependency, filename } = getName(path);

      if (!version) {
        console.log(
          `Could not find version ${version} for dependency ${dependency}`
        );

        return new Response("Version not found in URL", {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=0",
          },
        });
      }

      // Construct the cache key from the cache URL
      const cacheKey = new Request(url.toString(), request);
      const cache = caches.default;

      // Check whether the value is already available in the cache
      // if not, you will need to fetch it from R2, and store it in the cache
      // for future access
      let response = await cache.match(cacheKey);

      if (response) {
        console.log(`Cache hit for: ${request.url}.`);
        return response;
      }

      response;

      console.log(
        `Response for request url: ${request.url} not present in cache. Fetching and caching request.`
      );

      // If not in cache, get it from R2
      const objectKey = filename;

      try {
        const object = await env.NPM_TAR.get(objectKey)
          .then((object) => {
            return object;
          })
          .catch((err) => {
            console.log("Failed to retrieve file from R2: ", err);
            return null;
          });

        const headers = new Headers();

        headers.append(
          "Cache-Control",
          "public, max-age=10, s-maxage=10, inmutable"
        );
        headers.append("Content-Type", "application/octet-stream");
        headers.append(
          "content-disposition",
          `attachment; filename*=UTF-8''${encodeURIComponent(
            objectKey
          )}; filename="${objectKey}"`
        );

        if (object) {
          console.log(`Found object in R2: ${objectKey}`);

          // Set the appropriate object headers
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);

          response = new Response(object.body, {
            headers,
          });

          // Store the fetched response as cacheKey
          // Use waitUntil so you can return the response without blocking on
          // writing to cache
          context.waitUntil(cache.put(cacheKey, response.clone()));
        } else {
          const packageJson = await fetchPackage(dependency, false);
          const packageJsonObject = JSON.parse(packageJson);
          const packageVersion = packageJsonObject.versions[version];

          if (!packageVersion) {
            return new Response("Missing version", {
              headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "public, max-age=10",
              },
            });
          }

          const packageVersionPath = packageVersion.dist.tarball;
          const packageVersionResponse = await fetch(packageVersionPath);

          // Send the response to the client and cache it
          response = new Response(packageVersionResponse.body, {
            headers,
          });
          context.waitUntil(cache.put(cacheKey, response.clone()));

          // Store the downloaded tarball in R2
          env.NPM_TAR.put(objectKey, packageVersionResponse.body, {
            httpMetadata: {
              ...headers,
            },
          });
        }
      } catch (err) {
        console.log("Failed to retrieve file from R2: ", err);
        return new Response(JSON.stringify(err), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=0",
          },
        });
      }

      return response;
    } else {
      return new Response("Not Found", { status: 404 });
    }
  },
};

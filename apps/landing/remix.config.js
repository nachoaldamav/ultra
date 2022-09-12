/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildTarget: "vercel",
  server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
  ignoredRouteFiles: ["**/.*"],
  browserBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "api/_build",
  mdx: async () => {
    const [rehypeHighlight] = await Promise.all([
      import("rehype-highlight").then((mod) => mod.default),
    ]);
    return {
      rehypePlugins: [rehypeHighlight],
      remarkPlugins: [],
    };
  },
};

const esbuild = require("esbuild");
const Module = require("module");

const originalRequire = Module.prototype.require;
const originalBuild = esbuild.build;

const reactShim = [
  ...Object.keys(require("react")).map(
    (k) => `export const ${k} = window.React.${k}`
  ),
  "const React = window.React; export default React;",
].join("\n");
const reactDomShim = Object.keys(require("react-dom"))
  .map((k) => `export const ${k} = window.ReactDOM.${k}`)
  .join("\n");

// https://esbuild.github.io/plugins/#using-plugins
const externaliseReactPlugin = {
  name: "react",
  setup(build) {
    build.onResolve({ filter: /^react$/ }, (args) => ({
      path: args.path,
      namespace: "react-ns",
    }));

    build.onLoad({ filter: /.*/, namespace: "react-ns" }, (args) => ({
      contents: reactShim,
      loader: "js",
    }));

    build.onResolve({ filter: /^react-dom$/ }, (args) => ({
      path: args.path,
      namespace: "react-dom-ns",
    }));

    build.onLoad({ filter: /.*/, namespace: "react-dom-ns" }, (args) => ({
      contents: reactDomShim,
      loader: "js",
    }));
  },
};

function build(options) {
  if (options.platform !== "browser") return originalBuild(options);

  return originalBuild({
    ...options,
    external: [
      ...(options.external ? options.external : []),
      "react",
      "react-dom",
    ],
    plugins: [
      ...(options.plugins ? options.plugins : []),
      externaliseReactPlugin,
    ],
  });
}

Module.prototype.require = function (id) {
  // when remix requires esbuild, it will get our modified build function from above
  if (id === "esbuild") return { ...esbuild, build };

  return originalRequire.apply(this, arguments);
};

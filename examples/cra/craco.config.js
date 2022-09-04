const path = require("path");
const os = require("os");
const { getLoader, loaderByName } = require("@craco/craco");

// Relative paths to shared folders.
// IMPORTANT: If you want to directly import these (no symlink) these folders must also be added to tsconfig.json {"compilerOptions": "rootDirs": [..]}
const SRC_LOCATIONS = ["src", `${os.homedir()}/.snpm-cache`];

const updateWebpackConfig = {
  overrideWebpackConfig: ({ webpackConfig }) => {
    // Get hold of the babel-loader, so we can add shared folders to it, ensuring that they get compiled too
    const {
      match: { loader },
    } = getLoader(webpackConfig, loaderByName("babel-loader"));

    loader.include = SRC_LOCATIONS.map((p) => path.join(__dirname, p));

    return webpackConfig;
  },
};

module.exports = {
  plugins: [{ plugin: updateWebpackConfig, options: {} }],
};

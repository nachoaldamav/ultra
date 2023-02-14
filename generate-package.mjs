import inquirer from 'inquirer';
import fs from 'fs';
import { join } from 'path';
import { exec } from 'child_process';

const DEFAULT_TSUP_CONFIG = `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  clean: true,
  splitting: true,
  dts: true,
  outDir: "dist",
  format: "esm",
  outExtension() {
    return {
      js: ".js",
    };
  },
});
`;

const DEFAULT_SWC_CONFIG = `{
    "$schema": "https://json.schemastore.org/swcrc",
    "jsc": {
      "parser": {
        "syntax": "typescript",
        "tsx": false,
        "decorators": false,
        "dynamicImport": true
      },
      "transform": null,
      "target": "es2017",
      "loose": true,
      "externalHelpers": false
    },
    "minify": false
}
`;

const DEFAULT_PACKAGE_JSON = {
  name: 'name',
  version: '0.0.1',
  description: '',
  main: 'dist/index.js',
  types: 'dist/index.d.ts',
  type: 'module',
  scripts: {
    test: 'echo "Error: no test specified" && exit 1',
    build: 'tsup',
    dev: 'tsup --watch',
  },
  keywords: [],
  author: '',
  license: 'ISC',
  devDependencies: {
    '@ultrapkg/types': 'workspace:*',
    '@types/node': '^18.11.13',
    tsup: '6.5.0',
  },
  dependencies: {},
};

const DEFAULT_TSCONFIG = {
  extends: '../base.json',
  include: ['src/**/*.ts'],
  exclude: ['node_modules', 'dist', 'dist/types'],
};

const dirs = {
  src: {
    'index.ts': `export const name = "name";`,
  },
  'tsup.config.ts': DEFAULT_TSUP_CONFIG,
  'swc.config.json': DEFAULT_SWC_CONFIG,
  'package.json': DEFAULT_PACKAGE_JSON,
  'tsconfig.json': DEFAULT_TSCONFIG,
};

const questions = [
  {
    type: 'input',
    name: 'name',
    message: 'What is the name of the package?',
  },
  {
    type: 'confirm',
    name: 'scope',
    message: 'Is this package scoped?',
    default: true,
  },
  {
    type: 'input',
    name: 'folder',
    message: 'What is the folder name?',
    default: (answers) => answers.name,
  },
  {
    type: 'list',
    name: 'where',
    message: 'Where is the package?',
    choices: ['packages', 'apps'],
    default: 'packages',
  },
  {
    type: 'list',
    name: 'type',
    message: 'What type of package is it?',
    choices: ['swc', 'tsup', 'none'],
    default: 'tsup',
  },
];

async function main() {
  const answers = await inquirer.prompt(questions);
  let name = answers.name;
  const simpleName = answers.name;

  if (answers.scope) {
    name = `@ultrapkg/${answers.name}`;
  }

  const { folder, where, type } = answers;
  const path = `${where}/${folder}`;

  if (!fs.existsSync(join(path, 'src'))) {
    console.log(`Creating ${path}`);
    fs.mkdirSync(join(path, 'src'), { recursive: true });
  }

  const packageJson = {
    ...DEFAULT_PACKAGE_JSON,
    name,
  };

  console.log(`Creating package.json`);
  // Create package.json
  fs.writeFileSync(
    `${path}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsup.config.ts
  if (type === 'tsup') {
    console.log(`Creating tsup.config.ts`);
    fs.writeFileSync(`${path}/tsup.config.ts`, DEFAULT_TSUP_CONFIG);
  }

  // Create tsconfig.json
  console.log(`Creating tsconfig.json`);
  fs.writeFileSync(
    `${path}/tsconfig.json`,
    JSON.stringify(DEFAULT_TSCONFIG, null, 2)
  );

  // Create .swcrc
  if (type === 'swc') {
    console.log(`Creating .swcrc`);
    fs.writeFileSync(`${path}/.swcrc`, DEFAULT_SWC_CONFIG);
  }

  console.log(`Generating starter files...`);

  // Create src/name.ts
  fs.writeFileSync(
    `${path}/src/${simpleName}.ts`,
    `export const name = "${simpleName}";`
  );

  // Create src/index.ts
  fs.writeFileSync(
    `${path}/src/index.ts`,
    `export { name } from "./${simpleName}";`
  );

  console.log(`Done!`);

  console.log(`Installing dependencies...`);

  exec('pnpm i', {
    cwd: process.cwd() + `/${where}/${folder}`,
    stdio: 'inherit',
  });

  console.log(`Done!`);
}

main();

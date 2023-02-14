import os from 'node:os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { UltraError } from '@ultrapkg/error-logger';

const BASIC_CONFIG = {
  registry: 'https://registry.npmjs.org/',
  cache: path.join(os.homedir(), '.ultra-cache'),
};

type CONFIG = {
  registry: string;
  cache: string;
  token?: string;
};

export function readConfig(): CONFIG {
  try {
    const configPath = `${os.homedir()}/.ultra/.ultrarc`;
    const workspaceConfigPath = `${process.cwd()}/.ultrarc`;

    if (existsSync(workspaceConfigPath)) {
      // Replace basic config with workspace config
      const workspaceConfig = JSON.parse(
        readFileSync(workspaceConfigPath, 'utf8'),
      );
      return { ...BASIC_CONFIG, ...workspaceConfig };
    }

    if (!existsSync(configPath)) {
      // Create directory recursively
      mkdirSync(`${os.homedir()}/.ultra`, { recursive: true });
      writeFileSync(configPath, JSON.stringify(BASIC_CONFIG, null, 2));
      return JSON.parse(readFileSync(configPath, 'utf-8')) as CONFIG;
    } else {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as CONFIG;
    }
  } catch (error) {
    return new UltraError(
      'ERR_ULTRA_READ_CONFIG',
      'Error reading config',
      '@ultrapkg/read-config',
    ) as unknown as CONFIG;
  }
}

export function update(params: string[]) {
  const configPath = `${os.homedir()}/.ultra/.ultrarc`;
  const config = JSON.parse(readFileSync(configPath, 'utf8'));

  const [key, value] = params;
  config[key] = value;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

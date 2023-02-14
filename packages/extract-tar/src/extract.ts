import tar from 'tar';
import {
  createWriteStream,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs';
import axios from 'axios';
import { createHash } from 'node:crypto';
import https from 'https';
import os from 'node:os';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { readConfig } from '@ultrapkg/read-config';
import { readNpmConfig } from '@ultrapkg/npm-config';

type CONFIG = {
  registry: string;
  cache: string;
  token?: string;
};

const npmrc = readNpmConfig();
const { token, registry } = readConfig() as CONFIG;

// Get system temp directory
const tmpDir = os.tmpdir();

const cacheBasePath = path.join(tmpDir, 'ultra_tmp');

export async function ultraExtract(
  target: string,
  tarball: string,
  sha: string,
  name: string,
): Promise<void | { res: string }> {
  if (!tarball) {
    throw new Error('No tarball provided');
  }

  // Read .ultra file to know if it's fully installed
  const ultraFile = path.join(target, downloadFile);
  const ultraFileExists = existsSync(ultraFile);

  if (ultraFileExists || __DOWNLOADING.includes(tarball)) {
    return {
      res: 'skipped',
    };
  }

  __DOWNLOADING.push(tarball);

  const file = path.join(
    cacheBasePath,
    `${name.replaceAll('/', '-')}-${createHash('md5')
      .update(tarball)
      .digest('hex')}.${tarball.split('.').pop() || 'tgz'}`,
  );

  if (!existsSync(cacheBasePath)) {
    mkdirSync(cacheBasePath);
  }

  try {
    // If file exists and it's not corrupted, extract it directly
    if (
      !existsSync(file) ||
      sha !== createHash('sha1').update(readFileSync(file)).digest('hex')
    ) {
      const org = name.startsWith('@') ? name.split('/')[0] : null;

      const npmRegistry =
        (org ? npmrc[`${org}:registry`] : npmrc.registry) || registry;

      const parseRegistry = npmRegistry
        ? npmRegistry.replace(/https?:\/\//, '')
        : '';

      const npmToken = org
        ? npmrc[`//${parseRegistry}:_authToken`]
        : npmrc._authToken || token;

      const writer = createWriteStream(file);
      const response = await axios({
        url: tarball,
        method: 'GET',
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${npmToken}`,
          'keep-alive': 'timeout=5, max=1000',
        },
        httpsAgent: new https.Agent({
          keepAlive: true,
        }),
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const fileBuffer = readFileSync(file);
      const hashSum = createHash('sha512');

      hashSum.update(fileBuffer);
      const hash = `sha512-${hashSum.digest('base64')}`;

      if (hash !== sha) {
        ora().fail(chalk.red(`SHA512 mismatch for ${tarball}`));
        ora().fail(chalk.red(`Expected ${sha} but got ${hash}`));
      }

      __VERIFIED.push(tarball);
    }

    // Extract "package" directory from tarball to "target" directory
    mkdirSync(target, { recursive: true });

    await tar.extract({
      file,
      cwd: target,
      strip: 1,
    });

    // Create .ultra file
    writeFileSync(ultraFile, '{}');

    __DOWNLOADING.splice(__DOWNLOADING.indexOf(tarball), 1);

    return {
      res: 'extracted',
    };
  } catch (err: any) {
    // Try again but remove the file
    if (existsSync(file)) {
      unlinkSync(file);
    }

    ora(
      chalk.red(
        `Error extracting ${file} to ${target}, trying again: ${
          err.message || err
        }`,
      ),
    ).fail();

    return ultraExtract(target, tarball, sha, name);
  }
}

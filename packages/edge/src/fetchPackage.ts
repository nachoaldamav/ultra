import { modifyTarballs } from './modifyTarballs';

export function fetchPackage(
  packageName: string,
  full?: boolean,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const res = fetch(`https://registry.npmjs.org/${packageName}`, {
      headers: {
        Accept: full
          ? 'application/json'
          : 'application/vnd.npm.install-v1+json',
      },
    });
    res
      .then(async (response) => {
        if (response.status === 200) {
          const modified = modifyTarballs(await response.json());
          resolve(JSON.stringify(modified));
        } else {
          reject(new Error(`Could not find package ${packageName}`));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

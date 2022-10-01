export function fetchPackage(
  packageName: string,
  full?: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    const res = fetch(`https://registry.npmjs.org/${packageName}`, {
      headers: {
        Accept: full
          ? "application/json"
          : "application/vnd.npm.install-v1+json",
      },
    });
    res
      .then((response) => {
        if (response.status === 200) {
          response
            .text()
            .then((text) => {
              resolve(text);
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          reject(new Error(`Could not find package ${packageName}`));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

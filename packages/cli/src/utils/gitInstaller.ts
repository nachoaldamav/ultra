import chalk from "chalk";
import ora, { Ora } from "ora";

export async function gitInstall(
  manifest: any,
  parent?: string,
  spinner?: Ora
) {
  // Get repo name, owner, commit and domain from version
  // git+ssh://git@github.com:name/repo.git#1234
  // git+ssh://git@github.com:name/repo.git
  // git+https://git@github.com/name/repo.git
  // git://github.com/name/repo.git
  // github:name/repo#1234

  /* const { name, version } = manifest;
    const [repo, commit] = version.split("#");
    const [domain, owner, repoName] = repo.split("/");
    const repoPath = `${domain}/${owner}/${repoName}`; */

  ora(
    chalk.red(`Git install is not supported yet. we are working on it!`)
  ).fail();

  process.exit(1);
}

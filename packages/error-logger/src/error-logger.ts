import chalk from 'chalk';

function showStack(stack: string) {
  return stack.split('\n').slice(1).join('\n');
}

export class UltraError extends Error {
  constructor(code: string, message: string, pkg?: string) {
    super(message);

    console.error(
      `${chalk.bgRed(code)} ${chalk.red(message)} \n${chalk.gray(pkg)}${
        this.stack ? '\n' + chalk.gray(showStack(this.stack)) : ''
      }`,
    );
    process.exit(1);
  }
}

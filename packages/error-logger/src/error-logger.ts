import chalk from 'chalk';

function showStack(stack: string) {
  return stack.split('\n').slice(1).join('\n');
}

export class UltraError extends Error {
  code: string = 'ULTRA_UNKNOWN_ERROR';
  pkg: string = '@ultrapkg/core';

  constructor(
    code: string,
    message: string,
    pkg?: string,
    exit: boolean = true
  ) {
    super(message);

    this.code = code;
    this.pkg = pkg || this.pkg;

    console.error(
      `${chalk.bgRed(code)} ${chalk.red(message)} \n${chalk.gray(pkg)}${
        this.stack ? '\n' + chalk.gray(showStack(this.stack)) : ''
      }`
    );

    if (exit) process.exit(1);
  }
}

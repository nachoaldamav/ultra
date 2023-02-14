import Spinnies from 'spinnies';
import chalk from 'chalk';

type SpinnerOptions = {
  /**
   * Text to show in the spinner. If none is provided, the name field will be shown.
   */
  text?: string;
  /**
   * Indent the spinner with the given number of spaces.
   */
  indent?: number;
  /**
   * Initial status of the spinner.
   */
  status?: Spinnies.SpinnerStatus;
  /**
   * The color of the text that accompanies the spinner. If not specified, the console's default foreground color is used.
   */
  color?: Spinnies.Color;
  /**
   * The color for the text on success. Default value is `"green"`
   */
  succeedColor?: Spinnies.Color;
  /**
   * The color for the text on failure. Default value is `"red"`.
   */
  failColor?: Spinnies.Color;
  /**
   * The color of the spinner, when active. The default value is `"greenBright"`
   */
  spinnerColor?: Spinnies.Color;
};

export class Logger {
  private spinnies: Spinnies;

  constructor() {
    this.spinnies = new Spinnies();
  }

  private spinniesInstance(name: string, oldOptions: SpinnerOptions) {
    return {
      succeed: (options?: SpinnerOptions) =>
        this.succeed(name, options || oldOptions),
      start: (options?: SpinnerOptions) =>
        this.start(name, options || oldOptions),
      fail: (options?: SpinnerOptions) =>
        this.fail(name, options || oldOptions),
      update: (options?: SpinnerOptions) =>
        this.update(name, options || oldOptions),
      remove: () => this.remove(name, oldOptions),
    };
  }

  add(name: string, options: SpinnerOptions) {
    this.spinnies.add(name, options);
    return this.spinniesInstance(name, options);
  }

  start(name: string, options: SpinnerOptions) {
    this.spinnies.add(name, options);
    return this.spinniesInstance(name, options);
  }

  succeed(name: string, options: SpinnerOptions) {
    this.spinnies.succeed(name, options);
    return this.spinniesInstance(name, options);
  }

  fail(name: string, options: SpinnerOptions & { code?: string }) {
    const ErrorTemplate = `${chalk.bgRed(
      options.code || 'ULTRA_UNKNOWN_ERROR',
    )} ${chalk.red(options.text)}`;

    options.text = ErrorTemplate;

    this.spinnies.fail(name, options);
    return this.spinniesInstance(name, options);
  }

  update(name: string, options: SpinnerOptions) {
    this.spinnies.update(name, options);
    return this.spinniesInstance(name, options);
  }

  remove(name: string, options: SpinnerOptions) {
    this.spinnies.remove(name);
    return this.spinniesInstance(name, options);
  }

  stopAll() {
    this.spinnies.stopAll();
  }
}

export const logger = new Logger();

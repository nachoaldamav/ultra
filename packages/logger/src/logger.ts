export class Logger {
  private static instance: Logger;
  private static log: string[] = [];

  private constructor() {}

  public static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }

  public log(message: string) {
    Logger.log.push(message);
  }

  public getLog() {
    return Logger.log;
  }
}

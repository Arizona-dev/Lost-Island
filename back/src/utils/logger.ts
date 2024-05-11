enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  error(message: string, ...meta: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR]: ${message}`, ...meta);
    }
  }

  warn(message: string, ...meta: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN]: ${message}`, ...meta);
    }
  }

  info(message: string, ...meta: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO]: ${message}`, ...meta);
    }
  }

  debug(message: string, ...meta: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG]: ${message}`, ...meta);
    }
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }
}

const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO);

export default logger;

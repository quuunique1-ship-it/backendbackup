import pino from "pino";
import { Logger, LogFields } from "../../application/ports/Logger.js";

export class PinoLogger implements Logger {
  private readonly pino = pino({ level: "info" });

  info(fields: LogFields, message: string): void {
    this.pino.info(fields, message);
  }

  warn(fields: LogFields, message: string): void {
    this.pino.warn(fields, message);
  }

  error(fields: LogFields, message: string): void {
    this.pino.error(fields, message);
  }
}

export const logger = new PinoLogger();
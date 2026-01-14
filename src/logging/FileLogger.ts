import fs from "fs";
import path from "path";
import type { ILogger, LogEntry } from "./ILogger";

export class FileLogger implements ILogger {
  private logPath = path.join(process.cwd(), "logs", "app.log");

  async log(entry: LogEntry): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.logPath), { recursive: true });
    await fs.promises.appendFile(this.logPath, JSON.stringify(entry) + "\n", "utf8");
  }
}

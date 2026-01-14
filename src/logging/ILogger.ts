export interface LogEntry {
  timestamp: string; // ISO
  level: "info" | "error";
  user?: string; // email o id
  endpoint: string;
  params: unknown;
  duration: number; // ms
  result: "success" | "error";
  message?: string;
}

export interface ILogger {
  log(entry: LogEntry): Promise<void>;
}

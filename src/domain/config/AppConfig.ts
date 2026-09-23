export interface AppConfig {
  DATABASE_PATH: string;
  JWT_SECRET: string;
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  ADMIN_EMAIL: string;
}

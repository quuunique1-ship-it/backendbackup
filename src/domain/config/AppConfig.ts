export interface AppConfig {
  DATABASE_PATH: string;
  JWT_SECRET: string;
  APP_URL: string;
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}

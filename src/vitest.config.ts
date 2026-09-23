import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Pre-load .env file into process.env before test files load
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
import "reflect-metadata";
import { DataSource } from "typeorm";
import { createApp } from "./app.js";
import { config } from "./infrastructure/config/env.js";
import { TaskModel } from "./infrastructure/database/TaskModel.js";
import { TypeOrmTaskRepository } from "./infrastructure/database/TypeOrmTaskRepository.js";
import { TypeOrmUserRepo } from "./infrastructure/database/TypeOrmUserRepo.js";
import { UserModel } from "./infrastructure/database/UserModel.js";
import { logger } from "./infrastructure/logging/PinoLogger.js";

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: config.DATABASE_PATH,
  synchronize: true,
  logging: false,
  entities: [TaskModel, UserModel],
});

async function bootstrap() {
  await AppDataSource.initialize();
  logger.info({ databasePath: config.DATABASE_PATH }, "Database connected successfully");

  const existingUsers = await AppDataSource.query("SELECT id, email, username FROM users");
  const usedUsernames = new Set<string>(existingUsers.map((user: { username: string | null }) => user.username).filter(Boolean));
  for (const user of existingUsers as { id: string; email: string; username: string | null }[]) {
    if (user.username) continue;
    const base = user.email.split("@")[0].toLowerCase();
    let username = base;
    let suffix = 2;
    while (usedUsernames.has(username)) username = `${base}${suffix++}`;
    await AppDataSource.query("UPDATE users SET username = ? WHERE id = ?", [username, user.id]);
    usedUsernames.add(username);
  }

  const taskRepository = new TypeOrmTaskRepository(AppDataSource.getRepository(TaskModel));
  const userRepository = new TypeOrmUserRepo(AppDataSource.getRepository(UserModel));

  const app = createApp(taskRepository, userRepository, () => AppDataSource.query("SELECT 1"));

  app.listen(config.PORT, () => {
    logger.info({ environment: config.NODE_ENV, appUrl: config.APP_URL }, "Server listening");
  });
}

bootstrap().catch((err) => logger.error({ err }, "Application startup failed"));
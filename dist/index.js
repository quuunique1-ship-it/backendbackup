"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const app_js_1 = require("./app.js");
const env_js_1 = require("./infrastructure/config/env.js");
const TaskModel_js_1 = require("./infrastructure/database/TaskModel.js");
const TypeOrmTaskRepository_js_1 = require("./infrastructure/database/TypeOrmTaskRepository.js");
const TypeOrmUserRepo_js_1 = require("./infrastructure/database/TypeOrmUserRepo.js");
const UserModel_js_1 = require("./infrastructure/database/UserModel.js");
const PinoLogger_js_1 = require("./infrastructure/logging/PinoLogger.js");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "better-sqlite3",
    database: env_js_1.config.DATABASE_PATH,
    synchronize: true,
    logging: false,
    entities: [TaskModel_js_1.TaskModel, UserModel_js_1.UserModel],
});
async function bootstrap() {
    await exports.AppDataSource.initialize();
    PinoLogger_js_1.logger.info({ databasePath: env_js_1.config.DATABASE_PATH }, "Database connected successfully");
    const existingUsers = await exports.AppDataSource.query("SELECT id, email, username FROM users");
    const usedUsernames = new Set(existingUsers.map((user) => user.username).filter(Boolean));
    for (const user of existingUsers) {
        if (user.username)
            continue;
        const base = user.email.split("@")[0].toLowerCase();
        let username = base;
        let suffix = 2;
        while (usedUsernames.has(username))
            username = `${base}${suffix++}`;
        await exports.AppDataSource.query("UPDATE users SET username = ? WHERE id = ?", [username, user.id]);
        usedUsernames.add(username);
    }
    const taskRepository = new TypeOrmTaskRepository_js_1.TypeOrmTaskRepository(exports.AppDataSource.getRepository(TaskModel_js_1.TaskModel));
    const userRepository = new TypeOrmUserRepo_js_1.TypeOrmUserRepo(exports.AppDataSource.getRepository(UserModel_js_1.UserModel));
    const app = (0, app_js_1.createApp)(taskRepository, userRepository, () => exports.AppDataSource.query("SELECT 1"));
    app.listen(env_js_1.config.PORT, () => {
        PinoLogger_js_1.logger.info({ environment: env_js_1.config.NODE_ENV, appUrl: env_js_1.config.APP_URL }, "Server listening");
    });
}
bootstrap().catch((err) => PinoLogger_js_1.logger.error({ err }, "Application startup failed"));

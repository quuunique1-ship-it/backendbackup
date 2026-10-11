"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTasks = void 0;
const Logger_js_1 = require("../ports/Logger.js");
class GetTasks {
    taskRepository;
    logger;
    constructor(taskRepository, logger = Logger_js_1.silentLogger) {
        this.taskRepository = taskRepository;
        this.logger = logger;
    }
    async execute(actor, options) {
        const limit = options?.limit ?? 10;
        const offset = options?.offset ?? 0;
        const ownerIds = actor.role === "admin" ? undefined : [actor.id];
        const tasks = await this.taskRepository.findAll({
            limit,
            offset,
            ownerIds,
        });
        this.logger.info({ userId: actor.id, taskCount: tasks.length, limit, offset }, "Tasks retrieved successfully");
        return tasks.map((task) => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
            createdAt: task.createdAt,
            ownerId: task.ownerId,
            createdByUserId: task.createdByUserId,
            completedByUserId: task.completedByUserId,
        }));
    }
}
exports.GetTasks = GetTasks;

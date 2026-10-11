"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTaskById = void 0;
const AppError_1 = require("../../domain/errors/AppError");
const Logger_js_1 = require("../ports/Logger.js");
class GetTaskById {
    taskRepository;
    taskAccessPolicy;
    logger;
    constructor(taskRepository, taskAccessPolicy, logger = Logger_js_1.silentLogger) {
        this.taskRepository = taskRepository;
        this.taskAccessPolicy = taskAccessPolicy;
        this.logger = logger;
    }
    async execute(id, actor) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new AppError_1.NotFoundError(`Task with ID ${id} not found`);
        }
        const denial = this.taskAccessPolicy.canView(task, actor);
        if (denial) {
            throw denial;
        }
        this.logger.info({ taskId: task.id, userId: actor.id }, "Task retrieved successfully");
        return {
            id: task.id,
            title: task.title,
            completed: task.completed,
            createdAt: task.createdAt,
            ownerId: task.ownerId,
            createdByUserId: task.createdByUserId,
            completedByUserId: task.completedByUserId,
        };
    }
}
exports.GetTaskById = GetTaskById;

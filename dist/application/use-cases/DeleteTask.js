"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTask = void 0;
const AppError_1 = require("../../domain/errors/AppError");
const Logger_js_1 = require("../ports/Logger.js");
class DeleteTask {
    taskRepository;
    taskDeletionPolicy;
    logger;
    constructor(taskRepository, taskDeletionPolicy, logger = Logger_js_1.silentLogger) {
        this.taskRepository = taskRepository;
        this.taskDeletionPolicy = taskDeletionPolicy;
        this.logger = logger;
    }
    async execute(id, actor) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new AppError_1.NotFoundError(`Task with ID ${id} not found`);
        }
        const denial = this.taskDeletionPolicy.canDelete(task, actor);
        if (denial) {
            throw denial;
        }
        const deleted = await this.taskRepository.delete(id, task.ownerId);
        if (!deleted) {
            throw new AppError_1.ConflictError("Task was changed before deletion completed");
        }
        this.logger.info({ taskId: id, userId: actor.id }, "Task deleted successfully");
    }
}
exports.DeleteTask = DeleteTask;

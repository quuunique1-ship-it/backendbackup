"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTask = void 0;
const AppError_1 = require("../../domain/errors/AppError");
const Logger_js_1 = require("../ports/Logger.js");
class CompleteTask {
    taskRepository;
    userRepository;
    taskCompletionPolicy;
    logger;
    constructor(taskRepository, userRepository, taskCompletionPolicy, logger = Logger_js_1.silentLogger) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskCompletionPolicy = taskCompletionPolicy;
        this.logger = logger;
    }
    async execute(id, actor) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new Error("Task not found");
        }
        if (!task.ownerId) {
            throw new AppError_1.ValidationError("task has no owner");
        }
        const owner = await this.userRepository.findById(task.ownerId);
        if (!owner) {
            throw new AppError_1.ValidationError("task has no owner");
        }
        const denial = this.taskCompletionPolicy.canComplete(task, actor, owner);
        if (denial) {
            throw denial;
        }
        task.markAsCompleted(actor.id);
        const completedTask = await this.taskRepository.update(task);
        this.logger.info({ taskId: completedTask.id, userId: actor.id }, "Task completed successfully");
        return completedTask;
    }
}
exports.CompleteTask = CompleteTask;

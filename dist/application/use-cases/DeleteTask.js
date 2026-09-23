"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTask = void 0;
const AppError_1 = require("../../domain/errors/AppError");
class DeleteTask {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(id, actor) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            throw new Error("Task not found");
        }
        if (actor.role !== "admin" && task.ownerId !== actor.id) {
            throw new AppError_1.AppError(403, "You can only delete your own tasks");
        }
        await this.taskRepository.delete(id);
    }
}
exports.DeleteTask = DeleteTask;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTask = void 0;
const Task_1 = require("../../domain/entities/Task");
class CreateTask {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(title, ownerId = "system", createdByUserId = "system") {
        const taskId = Date.now().toString();
        const newTask = new Task_1.Task(taskId, title, false, new Date(), ownerId, createdByUserId);
        const savedTask = await this.taskRepository.save(newTask);
        return savedTask;
    }
}
exports.CreateTask = CreateTask;

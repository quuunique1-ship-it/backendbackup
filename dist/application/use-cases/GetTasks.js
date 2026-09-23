"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTasks = void 0;
class GetTasks {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async execute(options) {
        return await this.taskRepository.findAll(options);
    }
}
exports.GetTasks = GetTasks;

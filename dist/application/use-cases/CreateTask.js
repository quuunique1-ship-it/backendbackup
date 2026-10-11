"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTask = void 0;
const Task_1 = require("../../domain/entities/Task");
const Logger_js_1 = require("../ports/Logger.js");
class CreateTask {
    taskRepository;
    idGenerator;
    clock;
    logger;
    constructor(taskRepository, idGenerator, clock, logger = Logger_js_1.silentLogger) {
        this.taskRepository = taskRepository;
        this.idGenerator = idGenerator;
        this.clock = clock;
        this.logger = logger;
    }
    async execute(title, ownerId = "system", createdByUserId = "system") {
        const taskId = this.idGenerator.generate();
        const createdAt = this.clock.now();
        const newTask = Task_1.Task.create(title, taskId, createdAt, ownerId, createdByUserId);
        const savedTask = await this.taskRepository.save(newTask);
        this.logger.info({ taskId: savedTask.id, userId: createdByUserId, ownerId: savedTask.ownerId }, "Task created successfully");
        return {
            id: savedTask.id,
            title: savedTask.title,
            completed: savedTask.completed,
            createdAt: savedTask.createdAt,
            ownerId: savedTask.ownerId,
            createdByUserId: savedTask.createdByUserId,
            completedByUserId: savedTask.completedByUserId,
        };
    }
}
exports.CreateTask = CreateTask;

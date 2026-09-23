"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const User_1 = require("../../domain/entities/User");
class TaskController {
    createTaskUseCase;
    completeTaskUseCase;
    deleteTaskUseCase;
    getTasksUseCase;
    getTaskByIdUseCase;
    userRepository;
    constructor(createTaskUseCase, completeTaskUseCase, deleteTaskUseCase, getTasksUseCase, getTaskByIdUseCase, userRepository) {
        this.createTaskUseCase = createTaskUseCase;
        this.completeTaskUseCase = completeTaskUseCase;
        this.deleteTaskUseCase = deleteTaskUseCase;
        this.getTasksUseCase = getTasksUseCase;
        this.getTaskByIdUseCase = getTaskByIdUseCase;
        this.userRepository = userRepository;
    }
    async getActor(req) {
        const user = req.userId ? await this.userRepository.findById(req.userId) : null;
        return user ?? new User_1.User(req.userId ?? "unknown", "unknown", "", new Date(), req.userRole ?? "user", req.teamId ?? null);
    }
    async create(req, res, next) {
        try {
            const actor = await this.getActor(req);
            let ownerId = actor.id;
            if (actor.role === "admin" && req.body.ownerId) {
                const owner = await this.userRepository.findById(req.body.ownerId) ?? await this.userRepository.findByEmail(req.body.ownerId);
                if (!owner)
                    throw new Error("Assigned user not found");
                ownerId = owner.id;
            }
            const task = await this.createTaskUseCase.execute(req.body.title, ownerId, actor.id);
            res.status(201).json(task);
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
            const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
            const actor = await this.getActor(req);
            const users = actor.role === "leader" ? await this.userRepository.findAll() : [];
            const ownerIds = actor.role === "user"
                ? [actor.id]
                : actor.role === "leader"
                    ? users.filter((user) => user.teamId === actor.teamId).map((user) => user.id)
                    : undefined;
            const tasks = await this.getTasksUseCase.execute({ limit, offset, ownerIds });
            res.status(200).json(tasks);
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const id = req.params.id;
            // Replaced repository call and NotFound check with GetTaskById use case
            const task = await this.getTaskByIdUseCase.execute(id, await this.getActor(req));
            res.status(200).json(task);
        }
        catch (error) {
            next(error);
        }
    }
    async complete(req, res, next) {
        try {
            const id = req.params.id;
            const task = await this.completeTaskUseCase.execute(id, await this.getActor(req));
            res.status(200).json(task);
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const id = req.params.id;
            await this.deleteTaskUseCase.execute(id, await this.getActor(req));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TaskController = TaskController;

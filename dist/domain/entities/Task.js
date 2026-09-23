"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
class Task {
    id;
    title;
    completed;
    createdAt;
    ownerId;
    createdByUserId;
    completedByUserId;
    constructor(id, title, completed = false, createdAt = new Date(), ownerId = null, createdByUserId = null, completedByUserId = null) {
        this.id = id;
        this.title = title;
        this.completed = completed;
        this.createdAt = createdAt;
        this.ownerId = ownerId;
        this.createdByUserId = createdByUserId;
        this.completedByUserId = completedByUserId;
    }
    markAsCompleted(approvedByUserId) {
        this.completed = true;
        this.completedByUserId = approvedByUserId;
    }
}
exports.Task = Task;

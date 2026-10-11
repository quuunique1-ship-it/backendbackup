"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
class Task {
    _id;
    _title;
    _completed;
    _createdAt;
    _ownerId;
    _createdByUserId;
    _completedByUserId;
    constructor(id, title, completed, createdAt, ownerId = null, createdByUserId = null, completedByUserId = null) {
        this._id = id;
        this._title = title;
        this._completed = completed;
        this._createdAt = createdAt;
        this._ownerId = ownerId;
        this._createdByUserId = createdByUserId;
        this._completedByUserId = completedByUserId;
    }
    static create(title, id, createdAt, ownerId = null, createdByUserId = null) {
        return new Task(id, title, false, createdAt, ownerId, createdByUserId, null);
    }
    static fromPersistence(id, title, completed, createdAt, ownerId = null, createdByUserId = null, completedByUserId = null) {
        return new Task(id, title, completed, createdAt, ownerId, createdByUserId, completedByUserId);
    }
    get id() { return this._id; }
    get title() { return this._title; }
    get completed() { return this._completed; }
    get createdAt() { return this._createdAt; }
    get ownerId() { return this._ownerId; }
    get createdByUserId() { return this._createdByUserId; }
    get completedByUserId() { return this._completedByUserId; }
    toJSON() {
        return {
            id: this._id,
            title: this._title,
            completed: this._completed,
            createdAt: this._createdAt,
            ownerId: this._ownerId,
            createdByUserId: this._createdByUserId,
            completedByUserId: this._completedByUserId,
        };
    }
    markAsCompleted(approvedByUserId) {
        this._completed = true;
        this._completedByUserId = approvedByUserId;
    }
}
exports.Task = Task;

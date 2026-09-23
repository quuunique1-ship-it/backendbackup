"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
let TaskModel = class TaskModel {
    id;
    title;
    completed;
    ownerId;
    createdByUserId;
    completedByUserId;
    createdAt;
};
exports.TaskModel = TaskModel;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar" }),
    __metadata("design:type", String)
], TaskModel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], TaskModel.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean" }),
    __metadata("design:type", Boolean)
], TaskModel.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], TaskModel.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], TaskModel.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], TaskModel.prototype, "completedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], TaskModel.prototype, "createdAt", void 0);
exports.TaskModel = TaskModel = __decorate([
    (0, typeorm_1.Entity)("tasks")
], TaskModel);

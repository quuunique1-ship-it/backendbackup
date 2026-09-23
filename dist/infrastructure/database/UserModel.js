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
exports.UserModel = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
let UserModel = class UserModel {
    id;
    email;
    username;
    passwordHash;
    role;
    teamId;
    pendingTeamId;
    teamName;
    joinRequestTeamId;
    notifications;
    createdAt;
};
exports.UserModel = UserModel;
__decorate([
    (0, typeorm_1.PrimaryColumn)("uuid"),
    __metadata("design:type", String)
], UserModel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true }),
    __metadata("design:type", String)
], UserModel.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true, nullable: true }),
    __metadata("design:type", Object)
], UserModel.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], UserModel.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", default: "user" }),
    __metadata("design:type", String)
], UserModel.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], UserModel.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], UserModel.prototype, "pendingTeamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], UserModel.prototype, "teamName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], UserModel.prototype, "joinRequestTeamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "[]" }),
    __metadata("design:type", String)
], UserModel.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "datetime" }),
    __metadata("design:type", Date)
], UserModel.prototype, "createdAt", void 0);
exports.UserModel = UserModel = __decorate([
    (0, typeorm_1.Entity)("users")
], UserModel);

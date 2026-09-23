"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const User_1 = require("../../domain/entities/User");
const AppError_1 = require("../../domain/errors/AppError");
const env_1 = require("../../infrastructure/config/env");
class RegisterUser {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(dto) {
        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new AppError_1.AppError(400, "Email already in use");
        }
        const username = dto.email.split("@")[0].toLowerCase();
        if (await this.userRepository.findByUsername(username)) {
            throw new AppError_1.AppError(400, "Username already in use");
        }
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 10);
        const role = dto.email === env_1.config.ADMIN_EMAIL ? "admin" : (dto.role ?? "user");
        const userId = (0, uuid_1.v4)();
        const user = new User_1.User(userId, dto.email, passwordHash, new Date(), role, null, null, null, null, [], username);
        const savedUser = await this.userRepository.create(user);
        return {
            id: savedUser.id,
            email: savedUser.email,
            username: savedUser.username,
        };
    }
}
exports.RegisterUser = RegisterUser;

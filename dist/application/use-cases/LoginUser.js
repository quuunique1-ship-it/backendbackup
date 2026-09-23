"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../../domain/errors/AppError");
const env_1 = require("../../infrastructure/config/env");
class LoginUser {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(dto) {
        const user = await this.userRepository.findByEmail(dto.email)
            ?? await this.userRepository.findByUsername(dto.email.toLowerCase());
        if (!user) {
            throw new AppError_1.AppError(401, "Invalid credentials");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError_1.AppError(401, "Invalid credentials");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, teamId: user.teamId }, env_1.config.JWT_SECRET, {
            expiresIn: "1d",
        });
        const notifications = await this.userRepository.consumeNotifications(user.id);
        return { token, email: user.email, username: user.username, role: user.role, teamId: user.teamId, notifications };
    }
}
exports.LoginUser = LoginUser;

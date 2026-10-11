"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = require("../../domain/errors/AppError");
const Logger_js_1 = require("../ports/Logger.js");
class LoginUser {
    userRepository;
    tokenGenerator;
    logger;
    constructor(userRepository, tokenGenerator, logger = Logger_js_1.silentLogger) {
        this.userRepository = userRepository;
        this.tokenGenerator = tokenGenerator;
        this.logger = logger;
    }
    async execute(dto) {
        const user = await this.userRepository.findByEmail(dto.email)
            ?? await this.userRepository.findByUsername(dto.email.toLowerCase());
        if (!user) {
            throw new AppError_1.UnauthorizedError("Invalid credentials");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError_1.UnauthorizedError("Invalid credentials");
        }
        const token = this.tokenGenerator.createToken(user);
        const notifications = await this.userRepository.consumeNotifications(user.id);
        this.logger.info({ userId: user.id, role: user.role }, "User authenticated successfully");
        return { token, email: user.email, username: user.username, role: user.role, teamId: user.teamId, notifications };
    }
}
exports.LoginUser = LoginUser;

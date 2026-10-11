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
const WeakPasswordError_1 = require("../../domain/errors/WeakPasswordError");
const Logger_js_1 = require("../ports/Logger.js");
class RegisterUser {
    userRepository;
    config;
    passwordPolicy;
    logger;
    constructor(userRepository, config, passwordPolicy, logger = Logger_js_1.silentLogger) {
        this.userRepository = userRepository;
        this.config = config;
        this.passwordPolicy = passwordPolicy;
        this.logger = logger;
    }
    async execute(dto) {
        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new AppError_1.ValidationError("Email already in use");
        }
        const validationResult = this.passwordPolicy.validate(dto.password);
        if (!validationResult.isValid) {
            throw new WeakPasswordError_1.WeakPasswordError(validationResult.failures);
        }
        const username = dto.email.split("@")[0].toLowerCase();
        if (await this.userRepository.findByUsername(username)) {
            throw new AppError_1.ValidationError("Username already in use");
        }
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 10);
        const role = dto.email === this.config.ADMIN_EMAIL ? "admin" : (dto.role ?? "user");
        const userId = (0, uuid_1.v4)();
        const user = new User_1.User(userId, dto.email, passwordHash, new Date(), role, null, null, null, null, [], username);
        const savedUser = await this.userRepository.create(user);
        this.logger.info({ userId: savedUser.id, role: savedUser.role }, "User registered successfully");
        return {
            id: savedUser.id,
            email: savedUser.email,
            username: savedUser.username,
        };
    }
}
exports.RegisterUser = RegisterUser;

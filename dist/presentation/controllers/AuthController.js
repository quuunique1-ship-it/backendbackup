"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const Logger_js_1 = require("../../application/ports/Logger.js");
class AuthController {
    registerUser;
    loginUser;
    logger;
    constructor(registerUser, loginUser, logger = Logger_js_1.silentLogger) {
        this.registerUser = registerUser;
        this.loginUser = loginUser;
        this.logger = logger;
    }
    register = async (req, res, next) => {
        try {
            const { email, password, role } = req.body;
            const result = await this.registerUser.execute({ email, password, role });
            res.status(201).json(result);
        }
        catch (error) {
            this.logger.warn({ err: error }, "User registration request failed");
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.loginUser.execute({ email, password });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.warn({ err: error }, "User login request failed");
            next(error);
        }
    };
}
exports.AuthController = AuthController;

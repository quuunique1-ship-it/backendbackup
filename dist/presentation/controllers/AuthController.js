"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    registerUser;
    loginUser;
    constructor(registerUser, loginUser) {
        this.registerUser = registerUser;
        this.loginUser = loginUser;
    }
    register = async (req, res, next) => {
        try {
            const { email, password, role } = req.body;
            const result = await this.registerUser.execute({ email, password, role });
            res.status(201).json(result);
        }
        catch (error) {
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
            next(error);
        }
    };
}
exports.AuthController = AuthController;

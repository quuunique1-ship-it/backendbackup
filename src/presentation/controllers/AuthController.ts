// src/presentation/controllers/AuthController.ts
import { Request, Response, NextFunction } from "express";
import { RegisterUser } from "../../application/use-cases/RegisterUser.js";
import { LoginUser } from "../../application/use-cases/LoginUser.js";
import { Logger, silentLogger } from "../../application/ports/Logger.js";

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly logger: Logger = silentLogger
  ) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, role } = req.body;
      const result = await this.registerUser.execute({ email, password, role });
      res.status(201).json(result);
    } catch (error) {
      this.logger.warn({ err: error }, "User registration request failed");
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUser.execute({ email, password });
      res.status(200).json(result);
    } catch (error) {
      this.logger.warn({ err: error }, "User login request failed");
      next(error);
    }
  };
}
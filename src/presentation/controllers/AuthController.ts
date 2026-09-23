// src/presentation/controllers/AuthController.ts
import { Request, Response, NextFunction } from "express";
import { RegisterUser } from "../../application/use-cases/RegisterUser.js";
import { LoginUser } from "../../application/use-cases/LoginUser.js";

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser
  ) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, role } = req.body;
      const result = await this.registerUser.execute({ email, password, role });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUser.execute({ email, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
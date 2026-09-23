import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { AppError } from "../../domain/errors/AppError";
import { config } from "../../infrastructure/config/env";

export interface LoginUserDTO {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(private readonly userRepository: UserRepoInterface) {}

  async execute(dto: LoginUserDTO): Promise<{ token: string; email: string; username: string | null; role: string; teamId: string | null; notifications: string[] }> {
    const user = await this.userRepository.findByEmail(dto.email)
      ?? await this.userRepository.findByUsername(dto.email.toLowerCase());
    if (!user) {
      throw new AppError( 401,"Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError( 401,"Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id, role: user.role, teamId: user.teamId }, config.JWT_SECRET, {
      expiresIn: "1d",
    });

    const notifications = await this.userRepository.consumeNotifications(user.id);
    return { token, email: user.email, username: user.username, role: user.role, teamId: user.teamId, notifications };
  }
}
import bcrypt from "bcryptjs";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { AppError, UnauthorizedError } from "../../domain/errors/AppError";
import { TokenGenerator } from "../../domain/ports/TokenGenerator";
import { Logger, silentLogger } from "../ports/Logger.js";

export interface LoginUserDTO {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepoInterface,
    private readonly tokenGenerator: TokenGenerator,
    private readonly logger: Logger = silentLogger
  ) {}

  async execute(dto: LoginUserDTO): Promise<{ token: string; email: string; username: string | null; role: string; teamId: string | null; notifications: string[] }> {
    const user = await this.userRepository.findByEmail(dto.email)
      ?? await this.userRepository.findByUsername(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.tokenGenerator.createToken(user);

    const notifications = await this.userRepository.consumeNotifications(user.id);
    this.logger.info({ userId: user.id, role: user.role }, "User authenticated successfully");
    return { token, email: user.email, username: user.username, role: user.role, teamId: user.teamId, notifications };
  }
}
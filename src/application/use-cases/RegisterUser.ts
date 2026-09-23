import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { User, UserRole } from "../../domain/entities/User";
import { UserRepoInterface } from "../../domain/repositories/UserRepoInterface";
import { AppError } from "../../domain/errors/AppError";
import { config } from "../../infrastructure/config/env";

export interface RegisterUserDTO {
  email: string;
  password: string;
  role?: "user" | "leader";
}

export class RegisterUser {
  constructor(private readonly userRepository: UserRepoInterface) {}

  async execute(dto: RegisterUserDTO): Promise<{ id: string; email: string; username: string | null }> {
   const existingUser = await this.userRepository.findByEmail(dto.email);

if (existingUser) {
  throw new AppError(400, "Email already in use");
}

    const username = dto.email.split("@")[0].toLowerCase();
    if (await this.userRepository.findByUsername(username)) {
      throw new AppError(400, "Username already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role: UserRole = dto.email === config.ADMIN_EMAIL ? "admin" : (dto.role ?? "user");
    const userId = uuidv4();
    const user = new User(userId, dto.email, passwordHash, new Date(), role, null, null, null, null, [], username);

    const savedUser = await this.userRepository.create(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    };
  }
}
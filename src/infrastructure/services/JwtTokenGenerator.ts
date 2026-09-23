import jwt from "jsonwebtoken";
import { User } from "../../domain/entities/User";
import { TokenGenerator } from "../../domain/ports/TokenGenerator";

export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly secret: string) {}

  createToken(user: User): string {
    return jwt.sign({ userId: user.id, role: user.role, teamId: user.teamId }, this.secret, {
      expiresIn: "1d",
    });
  }
}

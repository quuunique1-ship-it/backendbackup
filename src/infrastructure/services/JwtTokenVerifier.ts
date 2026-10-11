import jwt from "jsonwebtoken";
import { UserRole } from "../../domain/entities/User";
import { TokenPayload, TokenVerifier } from "../../domain/ports/TokenVerifier";

export class JwtTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {}

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret) as {
      userId: string;
      role?: UserRole;
      teamId?: string | null;
    };

    return {
      userId: decoded.userId,
      role: decoded.role ?? "user",
      teamId: decoded.teamId ?? null,
    };
  }
}

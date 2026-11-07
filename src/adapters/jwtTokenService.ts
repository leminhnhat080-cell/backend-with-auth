import jwt, { SignOptions } from "jsonwebtoken";
import { ROLES } from "../domain/account";
import { TokenPayload, TokenService } from "../application/ports";

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = "8h",
  ) {
    if (secret.length < 32) throw new Error("JWT_SECRET phai dai it nhat 32 ky tu");
  }

  sign(payload: TokenPayload): string {
    return jwt.sign({ ...payload }, this.secret, {
      algorithm: "HS256",
      expiresIn: this.expiresIn as SignOptions["expiresIn"],
    });
  }

  verify(token: string): TokenPayload {
    const d = jwt.verify(token, this.secret, { algorithms: ["HS256"] });
    if (typeof d === "string" || typeof d.sub !== "string" || !(ROLES as readonly string[]).includes(d.role)) {
      throw new Error("INVALID_TOKEN");
    }
    return { sub: d.sub, role: d.role, managerId: d.managerId };
  }
}

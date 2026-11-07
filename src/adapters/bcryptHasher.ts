import bcrypt from "bcryptjs";
import { PasswordHasher } from "../application/ports";

export class BcryptHasher implements PasswordHasher {
  constructor(private readonly cost = 10) {}
  hash(plain: string) {
    return bcrypt.hash(plain, this.cost);
  }
  compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}

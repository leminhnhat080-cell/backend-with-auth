import { Account, Role } from "../domain/account";

export interface NewAccount {
  fullName: string;
  email: string;
  emailNormalized: string;
  username?: string;
  usernameNormalized?: string;
  phone: string;
  passwordHash: string;
  role: Role;
  status: "ACTIVE" | "LOCKED";
}

/** Repository nem loi nay khi vi pham unique index (ke ca khi 2 request dong thoi) */
export class DuplicateAccountError extends Error {
  constructor(public readonly field: "email" | "username") {
    super(`Duplicate ${field}`);
  }
}

export interface AccountRepository {
  findByEmailNormalized(emailNormalized: string): Promise<Account | null>;
  findByUsernameNormalized(usernameNormalized: string): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
  create(data: NewAccount): Promise<Account>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface TokenPayload {
  sub: string;
  role: Role;
  managerId?: string;
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload; // nem loi neu sai/het han
}

import { Types } from "mongoose";
import { Account } from "../domain/account";
import { AccountRepository, DuplicateAccountError, NewAccount } from "../application/ports";
import { AccountModel } from "./accountModel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDomain(d: any): Account {
  return {
    id: String(d._id),
    fullName: d.fullName,
    email: d.email,
    emailNormalized: d.emailNormalized,
    username: d.username ?? undefined,
    usernameNormalized: d.usernameNormalized ?? undefined,
    phone: d.phone,
    passwordHash: d.passwordHash,
    role: d.role,
    managerId: d.managerId ? String(d.managerId) : undefined,
    status: d.status,
    createdAt: d.createdAt,
  };
}

export class MongoAccountRepository implements AccountRepository {
  async findByEmailNormalized(emailNormalized: string) {
    const d = await AccountModel.findOne({ emailNormalized }).select("+passwordHash").lean();
    return d ? toDomain(d) : null;
  }

  async findByUsernameNormalized(usernameNormalized: string) {
    const d = await AccountModel.findOne({ usernameNormalized }).select("+passwordHash").lean();
    return d ? toDomain(d) : null;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const d = await AccountModel.findById(id).select("+passwordHash").lean();
    return d ? toDomain(d) : null;
  }

  async create(data: NewAccount) {
    try {
      const doc = await AccountModel.create(data);
      const full = await AccountModel.findById(doc._id).select("+passwordHash").lean();
      return toDomain(full);
    } catch (e: unknown) {
      const err = e as { code?: number; keyPattern?: Record<string, unknown> };
      if (err.code === 11000) {
        const key = Object.keys(err.keyPattern ?? {})[0] ?? "";
        throw new DuplicateAccountError(key.startsWith("username") ? "username" : "email");
      }
      throw e;
    }
  }
}

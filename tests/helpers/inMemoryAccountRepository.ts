import { Account } from "../../src/domain/account";
import { AccountRepository, DuplicateAccountError, NewAccount } from "../../src/application/ports";

/** Repo gia lap cho unit/API test (loi ich cua DI - CD4). Integration test dung Mongo that. */
export class InMemoryAccountRepository implements AccountRepository {
  items: Account[] = [];
  private seq = 0;

  async findByEmailNormalized(e: string) {
    return this.items.find((a) => a.emailNormalized === e) ?? null;
  }
  async findByUsernameNormalized(u: string) {
    return this.items.find((a) => a.usernameNormalized === u) ?? null;
  }
  async findById(id: string) {
    return this.items.find((a) => a.id === id) ?? null;
  }
  async create(data: NewAccount) {
    if (this.items.some((a) => a.emailNormalized === data.emailNormalized)) throw new DuplicateAccountError("email");
    if (data.usernameNormalized && this.items.some((a) => a.usernameNormalized === data.usernameNormalized)) {
      throw new DuplicateAccountError("username");
    }
    const acc: Account = { ...data, id: `acc${++this.seq}`, createdAt: new Date() };
    this.items.push(acc);
    return acc;
  }
}

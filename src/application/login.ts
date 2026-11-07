import { PublicAccount, toPublic } from "../domain/account";
import { normalizeEmail } from "../domain/normalize";
import { invalidCredentials } from "./errors";
import { AccountRepository, PasswordHasher, TokenService } from "./ports";

export class Login {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly accounts: AccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: { email: string; password: string }): Promise<{ token: string; account: PublicAccount }> {
    const account = await this.accounts.findByEmailNormalized(normalizeEmail(input.email));

    // Luon so sanh hash (ke ca khi khong co tai khoan) de thoi gian phan hoi khong lo email ton tai
    const hash = account?.passwordHash ?? (await (this.dummyHash ??= this.hasher.hash("dummy-password")));
    const ok = await this.hasher.compare(input.password, hash);

    // Sai email / sai mat khau / bi khoa -> CUNG MOT thong bao chung (UC02)
    if (!account || !ok || account.status !== "ACTIVE") throw invalidCredentials();

    const token = this.tokens.sign({ sub: account.id, role: account.role, managerId: account.managerId });
    return { token, account: toPublic(account) };
  }
}

import { PublicAccount, toPublic } from "../domain/account";
import { normalizeEmail, normalizeUsername } from "../domain/normalize";
import { duplicate } from "./errors";
import { AccountRepository, DuplicateAccountError, PasswordHasher } from "./ports";

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string; // da chuan hoa o validator
  password: string;
  username?: string;
}

export class RegisterCustomer {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterInput): Promise<PublicAccount> {
    const emailNormalized = normalizeEmail(input.email);
    const usernameNormalized = input.username ? normalizeUsername(input.username) : undefined;

    // Kiem tra som de tra loi ro rang...
    if (await this.accounts.findByEmailNormalized(emailNormalized)) throw duplicate("email");
    if (usernameNormalized && (await this.accounts.findByUsernameNormalized(usernameNormalized))) {
      throw duplicate("username");
    }

    const passwordHash = await this.hasher.hash(input.password);

    try {
      // ...nhung unique index moi la chot chan cuoi (race condition)
      const account = await this.accounts.create({
        fullName: input.fullName,
        email: input.email.trim(),
        emailNormalized,
        username: input.username?.trim(),
        usernameNormalized,
        phone: input.phone,
        passwordHash,
        role: "CUSTOMER", // BR-02: luon la CUSTOMER, khong doc role tu request
        status: "ACTIVE",
      });
      return toPublic(account);
    } catch (e) {
      if (e instanceof DuplicateAccountError) throw duplicate(e.field);
      throw e;
    }
  }
}

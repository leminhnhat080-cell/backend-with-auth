import { PublicAccount, toPublic } from "../domain/account";
import { Actor, canViewAccount } from "../domain/policy";
import { forbidden, unauthenticated } from "./errors";
import { AccountRepository } from "./ports";

export class GetMe {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(actor: Actor, targetId: string = actor.id): Promise<PublicAccount> {
    if (!canViewAccount(actor, targetId)) throw forbidden();
    const account = await this.accounts.findById(targetId);
    // Tai khoan bi xoa/khoa sau khi cap token -> coi nhu het phien
    if (!account || account.status !== "ACTIVE") throw unauthenticated();
    return toPublic(account);
  }
}

import mongoose from "mongoose";
import { AccountModel } from "../src/adapters/accountModel";
import { BcryptHasher } from "../src/adapters/bcryptHasher";
import { loadEnv } from "../src/config/env";
import { normalizeEmail } from "../src/domain/normalize";

async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) throw new Error("Dung: npx tsx scripts/set-password.ts <email> <matkhau>");
  await mongoose.connect(loadEnv().mongoUri);
  const hash = await new BcryptHasher(Number(process.env.BCRYPT_COST ?? 10)).hash(newPassword);
  const r = await AccountModel.updateOne({ emailNormalized: normalizeEmail(email) }, { passwordHash: hash });
  console.log(r.matchedCount ? "Da doi mat khau" : "Khong tim thay tai khoan");
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
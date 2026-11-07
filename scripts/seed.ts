// Seed tai khoan demo - chay lap an toan (upsert theo emailNormalized). Chi dung dev/test.
import mongoose from "mongoose";
import { AccountModel } from "../src/adapters/accountModel";
import { BcryptHasher } from "../src/adapters/bcryptHasher";
import { loadEnv } from "../src/config/env";
import { Role } from "../src/domain/account";

async function main() {
  const env = { ...loadEnv(), bcryptCost: Number(process.env.BCRYPT_COST ?? 10) };
  if (process.env.NODE_ENV === "production") throw new Error("Khong seed tren production");
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("Thieu SEED_PASSWORD");

  await mongoose.connect(env.mongoUri);
  await AccountModel.syncIndexes();
  const passwordHash = await new BcryptHasher(env.bcryptCost).hash(password);

  const upsert = async (email: string, fullName: string, phone: string, role: Role, managerId?: unknown) => {
    await AccountModel.updateOne(
      { emailNormalized: email },
      {
        $setOnInsert: {
          fullName, email, emailNormalized: email, phone, passwordHash, role, status: "ACTIVE",
          ...(managerId ? { managerId } : {}),
        },
      },
      { upsert: true },
    );
    return AccountModel.findOne({ emailNormalized: email }).lean();
  };

  await upsert("admin@hsushoe.test", "Admin Demo", "0900000001", "ADMIN");
  const manager = await upsert("manager@hsushoe.test", "Manager Demo", "0900000002", "MANAGER");
  await upsert("staff@hsushoe.test", "Staff Demo", "0900000003", "STAFF", manager!._id);
  await upsert("customer@hsushoe.test", "Customer Demo", "0900000004", "CUSTOMER");

  console.log("Seed xong: admin/manager/staff/customer @hsushoe.test");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Kiem tra ket noi MongoDB:  npm run db:check
 * Exit code 0 = OK, 1 = that bai. KHONG in ra chuoi ket noi/mat khau.
 */
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env";

// Che user:password neu loi cua driver co kem URI
const redact = (s: string) => s.replace(/\/\/[^@\s/]+@/g, "//***:***@");

async function main() {
  const { mongoUri } = loadEnv();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5_000 });
  await mongoose.connection.db!.admin().ping();
  console.log(`OK: ket noi MongoDB thanh cong (host: ${mongoose.connection.host}, db: ${mongoose.connection.name})`);
  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAIL:", redact(err instanceof Error ? err.message : String(err)));
    console.error("Goi y: kiem tra MONGODB_URI trong .env, user/password, va IP allow-list (Atlas > Network Access).");
    process.exit(1);
  });

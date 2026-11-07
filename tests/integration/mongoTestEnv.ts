import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AccountModel } from "../../src/adapters/accountModel";

let mongod: MongoMemoryServer | undefined;

/**
 * Ket noi Mongo cho integration test.
 * - Mac dinh: MongoDB in-memory (mongodb-memory-server) - lan dau se tai binary mongod.
 * - Hoac dat MONGODB_URI_TEST (vd: mongodb://localhost:27017/hsu_test).
 *   AN TOAN: ten database BAT BUOC chua "test" vi test se XOA du lieu collection accounts.
 *   Test KHONG doc MONGODB_URI trong .env de tranh xoa nham DB that.
 */
export async function connectTestMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI_TEST;
  if (uri) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    if (!/test/i.test(mongoose.connection.name)) {
      const name = mongoose.connection.name;
      await mongoose.disconnect();
      throw new Error(`Tu choi chay integration test: database "${name}" khong chua chu "test"`);
    }
  } else {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri("hsu_test"));
  }
  // Tao unique index nhu luc server khoi dong
  await AccountModel.syncIndexes();
}

export async function clearAccounts(): Promise<void> {
  await AccountModel.deleteMany({});
}

export async function disconnectTestMongo(): Promise<void> {
  await mongoose.disconnect();
  await mongod?.stop();
}

import { Schema, model } from "mongoose";
import { ROLES, STATUSES } from "../domain/account";

const accountSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    emailNormalized: { type: String, required: true, unique: true }, // index unique (CD2 4.2)
    username: { type: String, trim: true },
    usernameNormalized: { type: String },
    phone: { type: String, required: true },
    // select:false -> mac dinh query KHONG lay passwordHash (NFR-SEC-01)
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "CUSTOMER" },
    managerId: { type: Schema.Types.ObjectId, ref: "Account" },
    status: { type: String, enum: STATUSES, required: true, default: "ACTIVE" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// username la tuy chon -> unique CHI ap dung khi co gia tri (partial index)
accountSchema.index(
  { usernameNormalized: 1 },
  { unique: true, partialFilterExpression: { usernameNormalized: { $type: "string" } } },
);

// Lop bao ve thu 2: du co lo doc doc document day du, toJSON van khong tra passwordHash
accountSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const AccountModel = model("Account", accountSchema);

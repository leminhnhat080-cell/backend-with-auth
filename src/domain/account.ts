// Guest KHONG phai role luu trong DB (SRS 1.5)
export const ROLES = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["ACTIVE", "LOCKED"] as const;
export type AccountStatus = (typeof STATUSES)[number];

export interface Account {
  id: string;
  fullName: string;
  email: string;
  emailNormalized: string;
  username?: string;
  usernameNormalized?: string;
  phone: string;
  passwordHash: string;
  role: Role;
  managerId?: string; // chi co y nghia voi STAFF
  status: AccountStatus;
  createdAt: Date;
}

// Du lieu an toan de tra ra qua API: KHONG co passwordHash (NFR-SEC-01)
export type PublicAccount = Pick<
  Account,
  "id" | "fullName" | "email" | "username" | "phone" | "role" | "managerId" | "status" | "createdAt"
>;

export function toPublic(a: Account): PublicAccount {
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    username: a.username,
    phone: a.phone,
    role: a.role,
    managerId: a.managerId,
    status: a.status,
    createdAt: a.createdAt,
  };
}

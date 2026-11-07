import { Role } from "./account";

// Actor lay tu JWT (da xac thuc)
export interface Actor {
  id: string;
  role: Role;
  managerId?: string; // chi STAFF
}

// Du lieu toi thieu cua Order de kiem tra quyen cap doi tuong (CD3 muc 5.5, BR-20)
export interface OrderScope {
  orderStatus: string; // 'PENDING' | 'CONFIRMED' | ...
  accountId?: string | null;
  assignedStaffId?: string | null;
  handledByManagerId?: string | null;
  assignedStaffManagerId?: string | null; // managerId cua Staff dang duoc gan (caller tra ra)
}

/** Chi chinh chu hoac Admin duoc doc ho so tai khoan (P01 - AC 5) */
export function canViewAccount(actor: Actor, accountId: string): boolean {
  return actor.role === "ADMIN" || actor.id === accountId;
}

/** Quyen xem don theo pham vi: dung lai o P03-P06 */
export function canViewOrder(actor: Actor, order: OrderScope): boolean {
  switch (actor.role) {
    case "ADMIN":
      return true;
    case "CUSTOMER":
      return !!order.accountId && order.accountId === actor.id;
    case "STAFF":
      return !!order.assignedStaffId && order.assignedStaffId === actor.id;
    case "MANAGER":
      return (
        order.orderStatus === "PENDING" ||
        order.handledByManagerId === actor.id ||
        order.assignedStaffManagerId === actor.id
      );
    default:
      return false;
  }
}

/** Manager chi quan ly Staff thuoc managerId cua minh (BR-16) */
export function canManageStaff(actor: Actor, staff: { managerId?: string | null }): boolean {
  if (actor.role === "ADMIN") return true;
  return actor.role === "MANAGER" && !!staff.managerId && staff.managerId === actor.id;
}

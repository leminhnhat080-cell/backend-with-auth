// BR-22: email/username chuan hoa de kiem tra trung
export const normalizeEmail = (s: string): string => s.normalize("NFKC").trim().toLowerCase();
export const normalizeUsername = (s: string): string => s.normalize("NFKC").trim().toLowerCase();

// Chuan hoa SDT VN: bo khoang trang/ky tu thua, +84 / 84 -> 0
// (dung CUNG quy tac voi Order de tra cuu don Guest khop nhau)
export function normalizePhone(s: string): string {
  let p = s.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

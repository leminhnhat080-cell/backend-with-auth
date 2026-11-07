# HSU Shoe Shop - Backend

Express + TypeScript + MongoDB (Mongoose).

## Bat dau
```bash
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
# Dien gia tri that vao .env (hoac dung file .env duoc gui rieng - KHONG commit)
npm run db:check         # kiem tra ket noi MongoDB
npm run dev              # http://localhost:4000
```

## Scripts
| Script | Tac dung |
|---|---|
| `npm run dev` | Chay development (tu reload) |
| `npm run build` | Bien dich TypeScript -> `dist/` |
| `npm start` | Chay production tu `dist/` (can `npm run build` truoc) |
| `npm run typecheck` | Kiem tra kieu, khong sinh file |
| `npm run db:check` | Kiem tra ket noi MongoDB (khong in mat khau) |
| `npm run seed` | Tao tai khoan demo admin/manager/staff/customer @hsushoe.test (dev/test) |
| `npm test` | Unit + API test (nhanh, khong can MongoDB) |
| `npm run test:integration` | Integration test voi MongoDB that (unique index, race condition) |

## Bien moi truong
| Bien | Mo ta |
|---|---|
| `PORT` | Cong API (mac dinh 4000) |
| `MONGODB_URI` | Chuoi ket noi MongoDB |
| `CORS_ORIGIN` | Origin FE duoc phep, cach nhau bang dau phay |
| `JWT_SECRET` | Khoa ky JWT, >= 32 ky tu (chi `npm run dev/start/seed` can, `db:check` khong can) |
| `JWT_EXPIRES_IN` | Thoi han token, mac dinh `8h` |
| `BCRYPT_COST` | Do manh bam mat khau, mac dinh `10` |
| `SEED_PASSWORD` | Mat khau chung cho tai khoan demo (`npm run seed`) |

## Endpoint
- `GET /health` - kiem tra service song, kem trang thai DB
- `GET /api` - thong tin API
- `POST /api/auth/register` - dang ky Customer (role luon CUSTOMER) -> 201 / 400 / 409
- `POST /api/auth/login` - dang nhap -> 200 `{ token, account }` / 401 (loi chung)
- `POST /api/auth/logout` - can token -> 204 (frontend xoa token)
- `GET /api/auth/me` - can token -> ho so cua chinh minh
- Route khong ton tai -> `404 { error: { code: "NOT_FOUND", ... } }`
- Loi: `{ "error": { "code", "message", "details?" } }`; gui token: `Authorization: Bearer <token>`

## Phan quyen cho module khac (P02..P07)
```ts
import { createAuthenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { canViewOrder } from "../domain/policy";
router.patch("/orders/:id/confirm", authenticate, authorize("MANAGER", "ADMIN"), handler);
// trong handler: kiem tra pham vi du lieu bang domain/policy.ts
```

## Cau truc
```
src/
  app.ts            tao Express app (CORS, JSON, routes, loi)
  server.ts         entry point: doc env, noi MongoDB, listen
  config/env.ts     doc & kiem tra bien moi truong
  routes/           health.ts, api.ts (mount module P01..P07), auth.ts
  controllers/      authController.ts
  validators/       auth.ts (zod)
  domain/           account, normalize, policy (phan quyen cap doi tuong)
  application/      registerCustomer, login, getMe, ports, errors
  adapters/         Mongoose model/repository, bcrypt, JWT
  middleware/       authenticate (401), authorize (403), notFound, errorHandler
scripts/check-db.ts kiem tra ket noi MongoDB; scripts/seed.ts tai khoan demo
tests/              health, 404, loi JSON, CORS, env, auth (AC1-AC6)
tests/integration/  test voi MongoDB that (index, race condition)
```

## Integration test (MongoDB that)
```bash
npm run test:integration
```
- Mac dinh dung MongoDB **in-memory** (`mongodb-memory-server`); **lan dau can mang** de tai binary mongod, sau do duoc cache.
- Hoac dung Mongo local/Docker: dat `MONGODB_URI_TEST=mongodb://localhost:27017/hsu_test`.
  Ten database **bat buoc chua chu `test`** vi test xoa du lieu collection `accounts`.
- Test **khong doc `MONGODB_URI` trong `.env`**, nen khong the xoa nham DB that/Atlas.
- Noi dung: kiem tra unique index (email, username partial), 10 request dang ky dong thoi chi 1 thanh cong,
  mat khau duoc bam, `passwordHash` khong lo, tai khoan bi khoa mat hieu luc.

## Bao mat
- `.env` da nam trong `.gitignore`; chi commit `.env.example`.
- Truoc khi commit: `git status` khong duoc thay `.env`. Kiem tra: `git check-ignore -v .env`.
- Neu lo mat khau DB (commit nham, dang len cong khai) -> doi mat khau tren MongoDB Atlas ngay.

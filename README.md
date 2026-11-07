# HSU Shoe Shop - Backend

Express + TypeScript + MongoDB (Mongoose).

## Bắt đầu

```bash
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run db:check            # Kiểm tra kết nối MongoDB
npm run dev                 # http://localhost:4000
```

## Scripts
| Script | Tác dụng |
|---|---|
| `npm run dev` | Chạy development (tự reload) |
| `npm run build` | Biên dịch TypeScript -> dist/ |
| `npm start` | Chạy production từ dist/ (cần npm run build trước) |
| `npm run typecheck` | Kiểm tra kiểu, không sinh file |
| `npm run db:check` | Kiểm tra kết nối MongoDB (không in mật khẩu) |
| `npm run seed` | Tạo tài khoản demo admin/manager/staff/customer @hsushoe.test (dev/test) |
| `npm test` | Unit + API test (nhanh, không cần MongoDB) |
| `npm run test:integration` | Integration test với MongoDB thật (unique index, race condition) |

## Biến môi trường
| Biến | Mô tả |
|---|---|
| `PORT` | Cổng API (mặc định 4000) |
| `MONGODB_URI` | Chuỗi kết nối MongoDB |
| `CORS_ORIGIN` | Origin FE được phép, cách nhau bằng dấu phẩy |
| `JWT_SECRET` | Khóa ký JWT, >= 32 ký tự (chỉ npm run dev/start/seed cần, db:check không cần) |
| `JWT_EXPIRES_IN` | Thời hạn token, mặc định '8h' |
| `BCRYPT_COST` | Độ mạnh băm mật khẩu, mặc định '10' |
| `SEED_PASSWORD` | Mật khẩu chung cho tài khoản demo ('npm run seed') |

## Endpoint
- `GET /health` - kiểm tra service sống, kèm trạng thái DB
- `GET /api` - thông tin API
- `POST /api/auth/register` - đăng ký Customer (role luôn CUSTOMER) -> 201 / 400 / 409
- `POST /api/auth/login` - đăng nhập -> 200 { token, account } / 401 ('lỗi chung')
- `POST /api/auth/logout` - cần token -> 204 (frontend xóa token)
- `GET /api/auth/me` - cần token -> hồ sơ của chính mình
- Route không tồn tại -> `404 { error: { code: "NOT_FOUND", ... } }`
- Lỗi: `{ "error": { "code", "message", "details?" } }`; gửi token: `Authorization: Bearer <token>`

## Phân quyền cho module khác (P02..P07)
```ts
import { createAuthenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { canViewOrder } from "../domain/policy";
router.patch("/orders/:id/confirm", authenticate, authorize("MANAGER", "ADMIN"), handler);
// trong handler: kiểm tra phạm vi dữ liệu bằng domain/policy.ts
```

## Cấu trúc
```
src/
  app.ts            tạo Express app (CORS, JSON, routes, i)
  server.ts         entry point: đọc env, nối MongoDB, listen
  config/env.ts     đọc & kiểm tra biến môi trường
  routes/           health.ts, api.ts (mount module P01..P07), auth.ts
  controllers/      authController.ts
  validators/       auth.ts (zod)
  domain/           account, normalize, policy (phân quyền cấp đối tượng)
  application/      registerCustomer, login, getMe, ports, errors
  adapters/         Mongoose model/repository, bcrypt, JWT
  middleware/       authenticate (401), authorize (403), notFound, errorHandler
scripts/check-db.ts kiểm tra kết nối MongoDB; scripts/seed.ts tài khoản demo
tests/              health, 404, loi JSON, CORS, env, auth (AC1-AC6)
tests/integration/  test với MongoDB thật (index, race condition)
```

## Integration test (MongoDB thật)
```bash
npm run test:integration
```
- Mặc định dùng MongoDB in-memory (mongodb-memory-server); lần đầu cần mạng để tải binary mongod, sau đó được cache.
- Hoặc dùng Mongo local/Docker: đặt MONGODB_URI_TEST=mongodb://localhost:27017/hsu_test. Tên database bắt buộc chứa chữ test vì test xóa dữ liệu collection accounts.
- Test không đọc MONGODB_URI trong .env, nên không thể xóa nhầm DB thật/Atlas.
- Nội dung: kiểm tra unique index (email, username partial), 10 request đăng ký đồng thời chỉ 1 thành công, mật khẩu được băm, passwordHash không lộ, tài khoản bị khóa mất hiệu lực.

## Bảo mật
- `.env` đã nằm trong '.gitignore'; chỉ commit '.env.example'.
- Trước khi commit: `git status` không được thấy `.env`. Kiểm tra: `git check-ignore -v .env`.
- Nếu lỡ lộ mật khẩu DB (commit nhầm, đăng lên công khai) -> đổi mật khẩu trên MongoDB Atlas ngay.
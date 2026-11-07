import { Request, Response } from "express";
import { GetMe } from "../application/getMe";
import { Login } from "../application/login";
import { RegisterCustomer } from "../application/registerCustomer";
import { loginSchema, registerSchema } from "../validators/auth";

export class AuthController {
  constructor(
    private readonly registerCustomer: RegisterCustomer,
    private readonly login: Login,
    private readonly getMe: GetMe,
  ) {}

  register = async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const account = await this.registerCustomer.execute(input);
    res.status(201).json({ account });
  };

  signIn = async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await this.login.execute(input);
    res.status(200).json(result); // { token, account }
  };

  // JWT stateless: that su "xoa phien" do frontend xoa token. Endpoint nay giu hop dong API ro rang.
  logout = async (_req: Request, res: Response) => {
    res.status(204).end();
  };

  me = async (req: Request, res: Response) => {
    const account = await this.getMe.execute(req.actor!);
    res.json({ account });
  };
}

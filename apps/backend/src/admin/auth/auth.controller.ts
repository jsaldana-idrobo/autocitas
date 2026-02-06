import { Body, Controller, Post } from "@nestjs/common";
import { LoginDto } from "../dto/login.dto.js";
import { AuthService } from "./auth.service.js";

@Controller("admin/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}

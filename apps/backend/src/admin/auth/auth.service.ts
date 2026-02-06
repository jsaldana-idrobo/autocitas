import { UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { Model } from "mongoose";
import { AdminUser } from "../../schemas/admin-user.schema.js";
import { LoginDto } from "../dto/login.dto.js";

export class AuthService {
  constructor(
    @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUser>,
    private readonly jwtService: JwtService
  ) {}

  async login(payload: LoginDto) {
    const email = payload.email.toLowerCase().trim();
    const user = await this.adminUserModel.findOne({ email, active: true }).lean();
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = await this.jwtService.signAsync({
      sub: user._id.toString(),
      businessId: user.businessId ? user.businessId.toString() : undefined,
      role: user.role,
      resourceId: user.resourceId?.toString()
    });

    return { token };
  }
}

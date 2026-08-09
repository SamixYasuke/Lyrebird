import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@/auth/user.entity';
import { TenantEntity } from '@/tenants/tenant.entity';
import { SignupDto } from '@/auth/dto/signup.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { hashPassword, verifyPassword } from '@/auth/password';

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
  tenant: { id: string; name: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const tenant = await this.tenants.save(
      this.tenants.create({ name: dto.companyName.trim() }),
    );

    const user = await this.users.save(
      this.users.create({
        email,
        passwordHash: await hashPassword(dto.password),
        tenantId: tenant.id,
      }),
    );

    return this.buildResult(user, tenant);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({
      where: { email },
      relations: { tenant: true },
    });
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildResult(user, user.tenant);
  }

  async me(userId: string): Promise<AuthResult> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: { tenant: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.buildResult(user, user.tenant);
  }

  private async buildResult(
    user: UserEntity,
    tenant: TenantEntity,
  ): Promise<AuthResult> {
    const token = await this.jwt.signAsync({ sub: user.id });
    return {
      token,
      user: { id: user.id, email: user.email },
      tenant: { id: tenant.id, name: tenant.name },
    };
  }
}

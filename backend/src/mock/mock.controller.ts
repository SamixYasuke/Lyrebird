import {
  All,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { MockService } from '@/mock/mock.service';
import { RegisterMockDto } from '@/mock/register-mock.dto';
import type { UserEntity } from '@/auth/user.entity';

@Controller('mock')
export class MockController {
  constructor(private readonly mock: MockService) {}

  @Get()
  index() {
    return this.mock.index();
  }

  @Get(':slug/openapi.json')
  spec(@Param('slug') slug: string) {
    const api = this.mock.get(slug);
    if (!api) throw new NotFoundException(`No mock API "${slug}"`);
    return api.spec;
  }

  @Post(':slug/register')
  @UseGuards(JwtAuthGuard)
  register(
    @CurrentUser() user: UserEntity,
    @Param('slug') slug: string,
    @Body() dto: RegisterMockDto,
  ) {
    return this.mock.register(slug, dto, user);
  }

  @All(':slug/*path')
  dispatch(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const base = `/mock/${slug}`;
    const path = req.path.startsWith(base)
      ? req.path.slice(base.length)
      : req.path;
    const query = Object.fromEntries(
      Object.entries(req.query).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      ]),
    );
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : String(value ?? ''),
      ]),
    );
    const result = this.mock.handle(
      slug,
      req.method,
      path,
      query,
      (req.body ?? {}) as Record<string, unknown>,
      headers,
    );
    if (!result) throw new NotFoundException(`No mock API "${slug}"`);
    res.status(result.status);
    return result.body;
  }
}

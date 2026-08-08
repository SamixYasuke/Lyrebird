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
import { AdminKeyGuard } from '@/tenants/admin-key.guard';
import { MockService } from '@/mock/mock.service';
import { RegisterMockDto } from '@/mock/register-mock.dto';

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
  @UseGuards(AdminKeyGuard)
  register(@Param('slug') slug: string, @Body() dto: RegisterMockDto) {
    return this.mock.register(slug, dto);
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
    const result = this.mock.handle(
      slug,
      req.method,
      path,
      query,
      (req.body ?? {}) as Record<string, unknown>,
    );
    if (!result) throw new NotFoundException(`No mock API "${slug}"`);
    res.status(result.status);
    return result.body;
  }
}

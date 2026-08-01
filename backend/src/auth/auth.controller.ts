import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, GuestDto, BindDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('guest')
  guest(@Body() dto: GuestDto, @Req() req: any) {
    return this.service.guest(dto ?? {}, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('bind')
  @UseGuards(JwtAuthGuard)
  bind(@Body() dto: BindDto, @Req() req: any) {
    return this.service.bind(req.user.accountId, dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.service.login(dto, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.service.logout(dto.refreshToken);
  }
}

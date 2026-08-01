import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailController {
  constructor(private readonly service: MailService) {}

  /** GET /api/mail — current player's inbox (unread first). */
  @Get()
  inbox(@Req() req: any) {
    return this.service.inbox(req.user.accountId);
  }

  /** POST /api/mail/:id/read — mark a mail as read. */
  @Post(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.service.markRead(req.user.accountId, id);
  }

  /** POST /api/mail/:id/claim — claim reward attachments (idempotent). */
  @Post(':id/claim')
  claim(@Req() req: any, @Param('id') id: string) {
    return this.service.claim(req.user.accountId, id);
  }

  /** DELETE /api/mail/:id — delete a mail. */
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.accountId, id);
  }
}

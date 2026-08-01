import { Controller, Post, Body } from '@nestjs/common';
import { PurchaseService } from './purchase.service';

class ProcessPurchaseDto {
  playerId: string;
  productId: string;
  platform: string;
  platformTxId: string;
}

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}

  @Post()
  process(@Body() body: ProcessPurchaseDto) {
    return this.service.processPurchase(body);
  }
}

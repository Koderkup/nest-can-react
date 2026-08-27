import { Controller, Get } from '@nestjs/common';
import { OrdersService } from '@/features/orders/orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Get('products')
  getOrderProducts() {
    return this.ordersService.getOrderProducts();
  }
}
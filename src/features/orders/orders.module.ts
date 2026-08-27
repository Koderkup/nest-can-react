import { Module } from '@nestjs/common';
import { OrdersController } from '@/features/orders/orders.controller';
import { OrdersService } from '@/features/orders/orders.service';
import { ProductsModule } from '@/features/products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
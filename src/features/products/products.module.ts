import { Module } from '@nestjs/common';
import { ProductsController } from '@/features/products/products.controller';
import { ProductsService } from '@/features/products/products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
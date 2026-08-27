import { Injectable } from '@nestjs/common';
import { ProductsService } from '@/features/products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  getOrderProducts() {
    return this.productsService.getProducts();
  }
}
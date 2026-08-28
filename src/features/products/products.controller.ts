import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from '@/features/products/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts() {
    return this.productsService.getProducts();
  }
  @Get(':id')
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }
  @Get()
  getProduct(@Query('name') name: string, @Query('price') price: number) {
    return this.productsService.getProduct(name, price);
  }
}

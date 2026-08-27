import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private readonly products = [
    {
      id: 1,
      name: 'iPhone',
      price: 1000,
    },
    {
      id: 2,
      name: 'MacBook',
      price: 2000,
    },
  ];

  getProducts() {
    return this.products;
  }
}
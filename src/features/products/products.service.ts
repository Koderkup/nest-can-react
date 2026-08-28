import { Injectable } from '@nestjs/common';
const products = [
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
  {
    id: 3,
    name: 'iPad',
    price: 3000,
  },
  {
    id: 4,
    name: 'iPod',
    price: 4000,
  },
];
@Injectable()
export class ProductsService {
  private readonly products = products;

  getProducts() {
    console.log('getProducts');
    return this.products;
  }
  getProductById(id: string) {
    return this.products.find((p) => p.id === parseInt(id));
  }
  getProduct(name: string, price: number) {
    console.log(name, price);
    return this.products.find((p) => p.name === name && p.price === price);
  }
}

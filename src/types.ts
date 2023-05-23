export interface Order {
  id: string;
  date: string;
  totalAmount: number;
  email: string;
  customer: Customer;
  products: ProductWithQuantity[];
}

export interface Customer {
  email: string;
  fullName: string;
}

export interface Product {
  name: string;
  price: number;
}

export interface ProductWithQuantity extends Product {
  quantity: number;
}

export interface LambdaEvent {
  info: {
    fieldName: string;
  };
  arguments: {
    email: string;
    orderDate: string;
  };
}

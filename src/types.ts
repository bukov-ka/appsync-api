export interface Order {
  id: string;
  email: string;
  date: string;
  customer: Customer | null;
  products: Product[];
}

export interface Customer {
  email: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
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

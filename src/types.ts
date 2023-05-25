export interface Order {
  lineId: string;
  id: string;
  date: string;
  email: string;
  fullName: string;
  productId?: string; // Make 'productId' field optional
  totalAmount: number;
  quantity?: number; // Make 'quantity' field optional
  product?: Product;
  products?: { name: string; price: number; quantity: number }[];
}


export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface LambdaEvent {
  info: {
    fieldName: string;
  };
  arguments: {
    email?: string; // Make the email and orderDate optional since they may not always be present in the query
    orderDate?: string;
  };
}

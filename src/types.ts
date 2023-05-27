// The Order interface represents an order line
export interface Order {
  lineId: string;
  id: string;
  date: string;
  email: string;
  fullName: string;
  // Product for the line
  productId?: string;
  totalAmount: number;
  quantity?: number;
  product?: Product;
  // An array of product objects with names, prices and quantities
  products?: { name: string; price: number; quantity: number }[];
  // Sale price for the item
  price?: number;
}

// Product catalog item
export interface Product {
  id: string;
  name: string;
  price: number;
}

// The LambdaEvent interface represents an event received by a Lambda function,
// containing information about the GraphQL query or mutation being executed.
export interface LambdaEvent {
  info: {
    fieldName: string; // The name of the GraphQL field being resolved
  };
  arguments: {
    email?: string; // Make the email and orderDate optional since they may not always be present in the query
    orderDate?: string;
  };
}

import * as AWS from 'aws-sdk';
import { LambdaEvent, Order, Customer, Product } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const CUSTOMER_TABLE = process.env.CUSTOMER_TABLE!;
const ORDER_TABLE = process.env.ORDER_TABLE!;
const PRODUCT_TABLE = process.env.PRODUCT_TABLE!;

exports.handler = async (event: LambdaEvent) => {
  console.log('event', event);
  switch (event.info.fieldName) {
    case 'orders':
      return getOrders(event.arguments.email, event.arguments.orderDate);
    default:
      throw new Error(`Unknown field "${event.info.fieldName}"`);
  }
};

async function getOrders(email: string, orderDate: string): Promise<Order[]> {
  console.log('getOrders: Fetching orders for customer with email', email, 'and order date', orderDate);
  const params = {
    TableName: ORDER_TABLE,
    KeyConditionExpression: 'email = :e AND #orderDate = :d',
    ExpressionAttributeValues: {
      ':e': email,
      ':d': orderDate,
    },
    ExpressionAttributeNames: {
      '#orderDate': 'date', // Alias for the reserved keyword 'date'
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    console.log('getOrders: Fetched orders', result);
    const ordersWithProductIds: Order[] = result.Items as Order[];

    // Get all unique product names from the orders.
    const allUniqueProductNames = new Set(ordersWithProductIds.flatMap(order => order.product));

    // Fetch all products by their names.
    const productsByName = await getProductsByNames(Array.from(allUniqueProductNames));
    console.log('getOrders: Fetched products by names', productsByName);

    // Construct the final list of orders with fetched products.
    const orders = ordersWithProductIds.map(async order => {
      const customer = await getCustomerByEmail(order.email);
      return {
        ...order,
        customer: customer || {
          id: '',
          fullName: '',
          phone: '',
          email: '',
        },
        products: [productsByName[order.product]], // Set the product field with the corresponding product object
      };
    });

    return await Promise.all(orders); // Await all promises in the map function
  } catch (error) {
    console.error(`getOrders: Error querying orders - ${error}`, params);
    throw error;
  }
}

async function getProductsByNames(names: string[]): Promise<Record<string, Product>> {
  try {
    console.log('getProductsByNames: Fetching products by names', names);
    const productsPromise = names.map(async name => {
      const productParams = {
        TableName: PRODUCT_TABLE,
        Key: { name },
      };
      const productResult = await dynamoDb.get(productParams).promise();
      return productResult.Item as Product;
    });

    const products = await Promise.all(productsPromise);

    // Convert the array of products into a map with names as keys
    const productsByName: Record<string, Product> = {};
    products.forEach(product => {
      if (product) {
        productsByName[product.name] = product;
      }
    });

    return productsByName;
  } catch (error) {
    console.error(`getProductsByNames: Error fetching products by names - ${error}`);
    throw error;
  }
}


async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const params = {
    TableName: CUSTOMER_TABLE,
    Key: {
      email,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item as Customer | null;
  } catch (error) {
    console.error(`getCustomerByEmail: Error fetching customer by email - ${error}`, params);
    throw error;
  }
}

import * as AWS from 'aws-sdk';
import { LambdaEvent, Order, Customer, Product } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const CUSTOMER_TABLE = process.env.CUSTOMER_TABLE!;
const ORDER_TABLE = process.env.ORDER_TABLE!;
const PRODUCT_TABLE = process.env.PRODUCT_TABLE!;

exports.handler = async (event: LambdaEvent) => {
  switch (event.info.fieldName) {
    case 'orders':
      return getOrders(event.arguments.email, event.arguments.orderDate);
    default:
      throw new Error(`Unknown field "${event.info.fieldName}"`);
  }
};

async function getOrders(email: string, orderDate: string): Promise<Order[]> {
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

    const orders = await Promise.all(result.Items.map(async (order: Order) => ({
      ...order,
      customer: await getCustomerByEmail(order.email),
      products: await getProductsByOrderId(order.id),
    })));

    return orders;
  } catch (error) {
    console.error(`getOrders: Error querying orders - ${error}`, params);
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

async function getProductsByOrderId(orderId: string): Promise<Product[]> {
  const params = {
    TableName: PRODUCT_TABLE,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return result.Items as Product[] || [];
  } catch (error) {
    console.error(`getProductsByOrderId: Error fetching products for order - ${error}`, params);
    throw error;
  }
}

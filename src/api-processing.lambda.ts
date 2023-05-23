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
    IndexName: 'emailDateIndex',
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

    // Convert raw orders to Order type
    const ordersWithProductIds = result.Items.map((item: { id: string; date: string; email: string; product: string; quantity: number }) => ({
      id: item.id,
      date: item.date,
      totalAmount: 0, // Will be calculated later
      email: item.email,
      customer: null, // Will be fetched later
      products: [{ name: item.product, quantity: item.quantity }],
    })) as Order[];

    // Group orders by id (your logic added here)
    const groupedOrders = groupOrdersById(ordersWithProductIds);

    // Get all unique product names from the orders.
    const allUniqueProductNames = new Set(groupedOrders.flatMap(order => order.products.map(product => product.name)));

    // Fetch all products by their names.
    const productsByName = await getProductsByNames(Array.from(allUniqueProductNames));
    console.log('getOrders: Fetched products by names', productsByName);

    // Construct the final list of orders with fetched products.
    const ordersWithProducts = await Promise.all(groupedOrders.map(async order => {
      const customer = await getCustomerByEmail(order.email);
      const calculatedTotalAmount = order.products.reduce((total, product) => total + (productsByName[product.name].price * product.quantity), 0);
      return {
        ...order,
        customer: customer || {
          email: '',
          fullName: '',
        },
        totalAmount: calculatedTotalAmount,
        products: order.products.map(p => ({
          ...productsByName[p.name],
          quantity: p.quantity,
        })),
      };
    }));

    return ordersWithProducts;
  } catch (error) {
    console.error(`getOrders: Error querying orders - ${error}`, params);
    throw error;
  }
}

function groupOrdersById(ordersWithProductIds: Order[]): Order[] {
  const groupedOrders: { [key: string]: Order } = {};

  ordersWithProductIds.forEach(order => {
    if (!groupedOrders[order.id]) {
      groupedOrders[order.id] = { ...order };
    } else {
      if (groupedOrders[order.id].date !== order.date || groupedOrders[order.id].email !== order.email) {
        throw new Error(`Inconsistent date or email for order with id ${order.id}`);
      }

      groupedOrders[order.id].products.push(...order.products);
    }
  });

  return Object.values(groupedOrders);
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

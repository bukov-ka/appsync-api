import * as AWS from 'aws-sdk';
import { LRUCache } from './lru-cache';
import { LambdaEvent, Order, Product } from './types';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ORDER_TABLE = process.env.ORDER_TABLE!;
const PRODUCT_TABLE = process.env.PRODUCT_TABLE!;

// Configure the cache constants
const CACHE_TTL = 60 * 1000; // 1 minute in milliseconds
const CACHE_MAX_ITEMS = 500; // max number of products to store
const productCache = new LRUCache(CACHE_MAX_ITEMS, CACHE_TTL);

// Main Lambda function handler that routes the event to the appropriate resolver
exports.handler = async (event: LambdaEvent) => {
  console.log('event', event);
  switch (event.info.fieldName) {
    case 'orders':
      return getOrders(event.arguments.email!, event.arguments.orderDate!);
    default:
      throw new Error(`Unknown field "${event.info.fieldName}"`);
  }
};

// Fetch orders from the DynamoDB table using the provided email and order date
async function getOrders(email: string, orderDate: string): Promise<Order[]> {
  // Log the input values for debugging purposes
  console.log('getOrders: Fetching orders for customer with email', email, 'and order date', orderDate);

  // Build query parameters using the input values
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
    // Query the table with the specified parameters
    const result = await dynamoDb.query(params).promise();
    // Log the fetched orders for debugging purposes
    console.log('getOrders: Fetched orders', result);
    const productIds = Array.from(new Set(result.Items!.map((item: any) => item.productId))) as string[];
    const productsById = await getProductsByIds(productIds);
    const ordersWithProductIds = result.Items!.map((item: any) => ({
      lineId: item.lineId,
      id: item.id,
      date: item.date,
      email: item.email,
      fullName: item.fullName,
      productId: item.productId,
      totalAmount: item.totalAmount,
      quantity: item.quantity,
      price: item.price, // use the price stored in Orders table
      product: productsById[item.productId],
    })) as Order[];

    // Group orders by id
    const groupedOrders = groupOrdersById(ordersWithProductIds);

    return groupedOrders;
  } catch (error) {
    // Log the error and re-throw it
    console.error(`getOrders: Error querying orders - ${error}`, params);
    throw error;
  }
}

// Group orders by their id
function groupOrdersById(orders: Order[]): Order[] {
  const groupedOrders: { [key: string]: Order } = {};
  orders.forEach(order => {
    if (!groupedOrders[order.id]) {
      groupedOrders[order.id] = {
        ...order,
        products: [order.product!].map(p => ({
          name: p.name,
          price: order.price ?? p.price, // Use the order.price instead of p.price
          quantity: order.quantity ?? 0,
        })),
      };
      // Remove the root level object properties
      delete groupedOrders[order.id].product;
      delete groupedOrders[order.id].quantity;
      delete groupedOrders[order.id].productId;
      delete groupedOrders[order.id].price;
    } else {
      groupedOrders[order.id].products?.push({
        name: order.product!.name,
        price: order.price ?? order.product!.price, // Use the order.price instead of order.product.price
        quantity: order.quantity ?? 0,
      });
    }
  });

  return Object.values(groupedOrders).map(order => ({
    ...order,
    customer: {
      email: order.email,
      fullName: order.fullName,
    },
  }));
}

// Fetch products from the DynamoDB table using the provided array of ids
async function getProductsByIds(ids: string[]): Promise<Record<string, Product>> {
  try {
    console.log('getProductsByIds: Fetching products by ids', ids);

    // Fetch each product in parallel using a series of promises
    const productsPromise = ids.map(async id => {
      // Try getting the product from the cache
      let product = productCache.get(id);

      // If the product is not in the cache, fetch it from the database
      if (!product) {
        // Code to fetch the product from the database and store it in the cache
        const productParams = {
          TableName: PRODUCT_TABLE,
          Key: { id },
        };
        const productResult = await dynamoDb.get(productParams).promise();
        product = productResult.Item as Product;

        // Store the fetched product in the cache
        productCache.set(id, product);
      }

      return product;
    });

    // Await all the promises to resolve and build a map of fetched products
    const products = await Promise.all(productsPromise);
    const productsById: Record<string, Product> = {};
    products.forEach(product => {
      if (product) {
        productsById[product.id] = product;
      }
    });

    return productsById;
  } catch (error) {
    // Log the error and re-throw it
    console.error(`getProductsByIds: Error fetching products by ids - ${error}`);
    throw error;
  }
}

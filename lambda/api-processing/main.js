const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const CUSTOMER_TABLE = process.env.CUSTOMER_TABLE;
const ORDER_TABLE = process.env.ORDER_TABLE;
const PRODUCT_TABLE = process.env.PRODUCT_TABLE;

exports.handler = async (event) => {
  switch (event.info.fieldName) {
    case 'orders':
      console.log(`event: ${JSON.stringify(event)}`);
      return await getOrders(event.arguments.email, event.arguments.orderDate);
    default:
      throw new Error(`Unknown field "${event.info.fieldName}"`);
  }
};

async function getOrders(email, orderDate) {
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

    // Fetch additional data for nested fields (such as customer and products)
    const orders = await Promise.all(result.Items.map(async (order) => ({
      ...order,
      customer: await getCustomerByEmail(order.email),
      products: await getProductsByOrderId(order.id),
    })));

    return orders;
  } catch (error) {
    console.error('getOrders:' + error, params);
    throw error;
  }
}


// Function to fetch a customer by email
async function getCustomerByEmail(email) {
  const params = {
    TableName: CUSTOMER_TABLE,
    Key: {
      email,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error('getCustomerByEmail:' + error, params);
    throw error;
  }
}

// Function to fetch products for each order
async function getProductsByOrderId(orderId) {
  // Placeholder: You need to adjust the following code according to your data model to link products with orders.
  const params = {
    TableName: PRODUCT_TABLE,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('getProductsByOrderId:' + error, params);
    throw error;
  }
}

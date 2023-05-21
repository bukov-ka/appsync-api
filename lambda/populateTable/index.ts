import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async () => {
  try {
    const customerTableName = process.env.CUSTOMER_TABLE;
    const orderTableName = process.env.ORDER_TABLE;
    const productTableName = process.env.PRODUCT_TABLE;
    if (!customerTableName || !orderTableName || !productTableName) {
      throw new Error('Missing environment variables pointing to tables.');
    }

    // Define your initial test data here
    const customers = [
      {
        email: 'johndoe@example.com',
        fullName: 'John Doe',
      },
      {
        email: 'janedoe@example.com',
        fullName: 'Jane Doe',
      },
    ];

    const orders = [
      {
        id: 'order1',
        date: '2022-01-01',
        totalAmount: 100,
        customerEmail: 'johndoe@example.com', // use this field to associate customer with the order
      },
      {
        id: 'order2',
        date: '2022-01-02',
        totalAmount: 200,
        customerEmail: 'janedoe@example.com', // use this field to associate customer with the order
      },
    ];

    const products = [
      {
        name: 'Product A',
        price: 50,
        quantity: 10,
      },
      {
        name: 'Product B',
        price: 25,
        quantity: 20,
      },
    ];

    console.log(JSON.stringify(process.env));

    await Promise.all(
      customers.map((item) =>
        dynamoDb.put({ TableName: customerTableName, Item: item }).promise()
      )
    );

    await Promise.all(
      orders.map((item) =>
        dynamoDb.put({ TableName: orderTableName, Item: item }).promise()
      )
    );

    await Promise.all(
      products.map((item) =>
        dynamoDb.put({ TableName: productTableName, Item: item }).promise()
      )
    );

    console.log('Test data populated successfully.');

    return {
      statusCode: 200,
      message: 'Tables populated with test data.',
    };
  } catch (error) {
    console.error('Error populating test data:', error);
    throw error;
  }
};

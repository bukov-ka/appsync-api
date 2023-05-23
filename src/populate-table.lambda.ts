import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async () => {
  try {
    // Get the table names from the environment variables
    const customerTableName = process.env.CUSTOMER_TABLE;
    const orderTableName = process.env.ORDER_TABLE;
    const productTableName = process.env.PRODUCT_TABLE;
    if (!customerTableName || !orderTableName || !productTableName) {
      throw new Error('Missing environment variables pointing to tables.');
    }

    // Initial test data here
    // In a real world scenario, these would be populated from a database or other source
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
        email: 'johndoe@example.com', // use this field to associate customer with the order
        product: 'Product A', // use this field to associate product with the order
        quantity: 3,
      },
      {
        id: 'order3',
        date: '2022-01-01',
        email: 'johndoe@example.com', // use this field to associate customer with the order
        product: 'Product B', // use this field to associate product with the order
        quantity: 1,
      },
      {
        id: 'order2',
        date: '2022-01-02',
        email: 'janedoe@example.com', // use this field to associate customer with the order
        product: 'Product A', // use this field to associate product with the order
        quantity: 5,
      },
    ];
    const products = [
      {
        name: 'Product A',
        price: 50,
      },
      {
        name: 'Product B',
        price: 25,
      },
    ];

    // Put the items to the tables
    // Put the items to the tables
    const items = [customers, orders, products];
    const tableNames = [customerTableName, orderTableName, productTableName];

    console.log('Putting the items to the tables:');
    await Promise.all(
      tableNames.map((tableName, index) => {
        const currentItemBatch = items[index].map(item => ({
          PutRequest: {
            Item: item,
          },
        }));

        console.log(`Putting the items to the ${tableName} table:`, currentItemBatch);
        // Batch write the items to the table
        return dynamoDb.batchWrite({
          RequestItems: {
            [tableName]: currentItemBatch,
          },
        })
          .promise()
          .catch((error: any) => {
            console.error(`Error putting items to table ${tableName}:`, error);
            throw error;
          });
      }),
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

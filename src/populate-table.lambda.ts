import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

// Mapping of table names to their primary key attribute names

export const handler = async () => {
  try {
    // Get the table names from the environment variables
    const orderTableName = process.env.ORDER_TABLE;
    const productTableName = process.env.PRODUCT_TABLE;
    if (!orderTableName || !productTableName) {
      throw new Error('Missing environment variables pointing to tables.');
    }
    const primaryKeyMapping = {
      [orderTableName]: 'lineId', // Assuming 'lineId' is the primary key for the order table
      [productTableName]: 'id', // Assuming 'id' is the primary key for the product table
    };

    // Initial test data here
    // In a real world scenario, these would be populated from a database or other source
    const orders = [
      {
        lineId: '1',
        id: 'order1',
        date: '2022-01-01',
        email: 'johndoe@example.com',
        fullName: 'John Doe', // include fullName directly in the orders array
        productId: 'productA', // use this field to associate product with the order
        totalAmount: 175.0,
        quantity: 3,
      },
      {
        lineId: '2',
        id: 'order1',
        date: '2022-01-01',
        email: 'johndoe@example.com',
        fullName: 'John Doe', // include fullName directly in the orders array
        productId: 'productB', // use this field to associate product with the order
        totalAmount: 175.0,
        quantity: 1,
      },
      {
        lineId: '3',
        id: 'order2',
        date: '2022-01-02',
        email: 'janedoe@example.com', // use this field to associate customer with the order
        fullName: 'Jane Doe', // include fullName directly in the orders array
        productId: 'productA', // use this field to associate product with the order
        quantity: 5,
        totalAmount: 125.0,
      },
    ];
    const products = [
      {
        id: 'productA',
        name: 'Product A',
        price: 50,
      },
      {
        id: 'productB',
        name: 'Product B',
        price: 25,
      },
    ];

    // Put the items to the tables
    const items = [orders, products];
    const tableNames = [orderTableName, productTableName];

    // Clear the tables before populating
    console.log('Clearing the tables:', tableNames);
    await Promise.all(
      tableNames.map(async (tableName) => {
        await clearTable(tableName, primaryKeyMapping);
      }),
    );

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

// Helper function to clear table
async function clearTable(tableName: string, primaryKeyMapping: { [x: string]: string }) {
  const primaryKeyAttributeName = primaryKeyMapping[tableName];

  const params = {
    TableName: tableName,
    ProjectionExpression: '#id',
    ExpressionAttributeNames: {
      '#id': primaryKeyAttributeName,
    },
  };
  // Get the items from the table and delete them
  const items = await dynamoDb.scan(params).promise();
  if (items.Items.length > 0) {
    const deleteReqs = items.Items.map((item: any) => (
      {
        DeleteRequest: {
          Key: item,
        },
      }
    ));

    return dynamoDb.batchWrite({
      RequestItems: {
        [tableName]: deleteReqs,
      },
    }).promise();
  }
}


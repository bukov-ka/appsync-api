// import * as path from 'path';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
// Import the generated lambdas
import { ApiProcessingFunction } from './api-processing-function';
import { PopulateTableFunction } from './populate-table-function';


export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Create the DynamoDB table for Customers
    const customerTable = new dynamodb.Table(this, 'customerTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create the DynamoDB table for Orders
    const orderTable = new dynamodb.Table(this, 'orderTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create the DynamoDB table for Products
    const productTable = new dynamodb.Table(this, 'productTable', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    // This is a demo app, so we'll clean up resources when the stack is deleted
    // For production we need to retain the data
    customerTable.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    orderTable.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    productTable.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create a new Lambda function to populate the table
    const populateTableFunction = new PopulateTableFunction(this, 'PopulateTableFunction');
    // const populateTableFunction = new lambda.Function(this, 'PopulateTableFunction', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/populateTable')),
    // });

    // Grant read and write access to your DynamoDB table for the Lambda function
    customerTable.grantReadWriteData(populateTableFunction);
    orderTable.grantReadWriteData(populateTableFunction);
    productTable.grantReadWriteData(populateTableFunction);

    // Add the table name as an environment variable to the Lambda function
    populateTableFunction.addEnvironment('CUSTOMER_TABLE', customerTable.tableName);
    populateTableFunction.addEnvironment('ORDER_TABLE', orderTable.tableName);
    populateTableFunction.addEnvironment('PRODUCT_TABLE', productTable.tableName);

    // Create a custom resource to trigger the Lambda function on stack deployment
    const customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    customResourceRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:*:*:*'],
    }));

    customResourceRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [populateTableFunction.functionArn],
    }));

    new cr.AwsCustomResource(this, 'PopulateTableCustomResource', {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        physicalResourceId: cr.PhysicalResourceId.of('PopulateTableCustomResourceId'),
        parameters: {
          FunctionName: populateTableFunction.functionName,
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
      role: customResourceRole,
    });


    // Create the AppSync API
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'customerOrders',
      schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
      xrayEnabled: true,
    });


    // Create the Lambda function
    // const customerLambda = new lambda.Function(this, 'AppSyncHandler', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   handler: 'main.handler',
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api-processing')),
    //   memorySize: 1024,
    // });

    const customerLambda = new ApiProcessingFunction(this, 'AppSyncHandler');
    // Set the data source for the API
    const customerDataSource = api.addLambdaDataSource('CustomerTableDataSource', customerLambda);

    // Create resolvers
    customerDataSource.createResolver(
      'customerQueryResolver',
      {
        typeName: 'Query',
        fieldName: 'orders',
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      },
    );

    // Output the API Key and URL
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
    });

    // Grant read permissions on DynamoDB table to the Lambda function
    customerTable.grantReadData(customerLambda);
    orderTable.grantReadData(customerLambda);
    productTable.grantReadData(customerLambda);
    customerLambda.addEnvironment('CUSTOMER_TABLE', customerTable.tableName);
    customerLambda.addEnvironment('ORDER_TABLE', orderTable.tableName);
    customerLambda.addEnvironment('PRODUCT_TABLE', productTable.tableName);

  }
}

console.log('-->' + process.env.CDK_DEFAULT_REGION);
console.log('-->' + process.env.CDK_DEFAULT_ACCOUNT);
// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'appsync-api-dev', { env: devEnv });
// new MyStack(app, 'appsync-api-prod', { env: prodEnv });

app.synth();
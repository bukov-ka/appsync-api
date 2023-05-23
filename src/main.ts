import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as awsCdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as customResources from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
// Import the generated lambdas
import { ApiProcessingFunction } from './api-processing-function';
import { PopulateTableFunction } from './populate-table-function';

const API_KEY_EXPIRATION = awsCdk.Duration.days(365);

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // Create the DynamoDB tables
    const { customerTable, orderTable, productTable } = this.createDynamoDbTableStructure();

    // Create a custom resource to trigger the Lambda function on stack deployment
    this.populateDataOnDeploy(customerTable, orderTable, productTable);

    // Create the AppSync API
    const appSyncAPI = new appsync.GraphqlApi(this, 'Api', {
      name: 'customerOrders',
      schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: awsCdk.Expiration.after(API_KEY_EXPIRATION),
          },
        },
      },
      xrayEnabled: true,
    });

    // Lambda to process requests
    const backendLambda = new ApiProcessingFunction(this, 'AppSyncHandler');
    // Grant read permissions on DynamoDB table to the Lambda function
    customerTable.grantReadData(backendLambda);
    orderTable.grantReadData(backendLambda);
    productTable.grantReadData(backendLambda);
    backendLambda.addEnvironment('CUSTOMER_TABLE', customerTable.tableName);
    backendLambda.addEnvironment('ORDER_TABLE', orderTable.tableName);
    backendLambda.addEnvironment('PRODUCT_TABLE', productTable.tableName);

    // Set the data source for the API
    const customerDataSource = appSyncAPI.addLambdaDataSource('CustomerTableDataSource', backendLambda);

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
    new awsCdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: appSyncAPI.graphqlUrl,
    });

    new awsCdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: appSyncAPI.apiKey || '',
    });
  }

  // Create the DynamoDB table for Customers, Orders, Products
  private createDynamoDbTableStructure() {
    // Create the DynamoDB table for Customers
    const customerTable = new dynamodb.Table(this, 'customerTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create the DynamoDB table for Orders
    const orderTable = new dynamodb.Table(this, 'orderTable', {
      partitionKey: { name: 'lineId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Add GSI for querying by email and date
    orderTable.addGlobalSecondaryIndex({
      indexName: 'emailDateIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
    });

    // Create the DynamoDB table for Products
    const productTable = new dynamodb.Table(this, 'productTable', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // This is a demo app, so we'll clean up resources when the stack is deleted
    // For production we need to retain the data
    customerTable.applyRemovalPolicy(awsCdk.RemovalPolicy.DESTROY);
    orderTable.applyRemovalPolicy(awsCdk.RemovalPolicy.DESTROY);
    productTable.applyRemovalPolicy(awsCdk.RemovalPolicy.DESTROY);
    return { customerTable, orderTable, productTable };
  }

  // Create a custom resource to trigger the Lambda function on stack deployment
  private populateDataOnDeploy(customerTable: dynamodb.Table, orderTable: dynamodb.Table, productTable: dynamodb.Table) {
    // Create a new Lambda function to populate the table
    const populateTableFunction = new PopulateTableFunction(this, 'PopulateTableFunction');

    // Grant read and write access to your DynamoDB table for the Lambda function
    customerTable.grantReadWriteData(populateTableFunction);
    orderTable.grantReadWriteData(populateTableFunction);
    productTable.grantReadWriteData(populateTableFunction);

    // Add the table name as an environment variable to the Lambda function
    populateTableFunction.addEnvironment('CUSTOMER_TABLE', customerTable.tableName);
    populateTableFunction.addEnvironment('ORDER_TABLE', orderTable.tableName);
    populateTableFunction.addEnvironment('PRODUCT_TABLE', productTable.tableName);
    // Create a custom role to add policies to it
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

    new customResources.AwsCustomResource(this, 'PopulateTableCustomResource', {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        physicalResourceId: customResources.PhysicalResourceId.of('PopulateTableCustomResourceId'),
        parameters: {
          FunctionName: populateTableFunction.functionName,
        },
      },
      policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({ resources: customResources.AwsCustomResourcePolicy.ANY_RESOURCE }),
      role: customResourceRole,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'appsync-api-dev', { env: devEnv });
// new MyStack(app, 'appsync-api-prod', { env: prodEnv });

app.synth();
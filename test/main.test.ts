import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { OrdersAPIStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new OrdersAPIStack(app, 'test');

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();

  // Check for a Lambda function 'Populate*'
  const populateLambda = Object.keys(template.findResources('AWS::Lambda::Function')).filter(
    (key) => key.startsWith('Populate'),
  );
  expect(populateLambda.length).toBeGreaterThan(0);

  // Check that there is at least one DynamoDB table
  template.resourceCountIs('AWS::DynamoDB::Table', 2);

  // Check for an AppSync API
  template.resourceCountIs('AWS::AppSync::GraphQLApi', 1);

  // Check for GraphQLAPIKey and GraphQLAPIURL strings in the output
  expect(Object.keys(template.findOutputs('GraphQLAPIKey')).length).toBeGreaterThan(0);
  expect(Object.keys(template.findOutputs('GraphQLAPIURL')).length).toBeGreaterThan(0);
});

// ~~ Generated by projen. To modify, edit .projenrc.ts and run "npx projen".
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * Props for ApiProcessingFunction
 */
export interface ApiProcessingFunctionProps extends lambda.FunctionOptions {
}

/**
 * An AWS Lambda function which executes src/api-processing.
 */
export class ApiProcessingFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props?: ApiProcessingFunctionProps) {
    super(scope, id, {
      description: 'src/api-processing.lambda.ts',
      ...props,
      runtime: new lambda.Runtime('nodejs16.x', lambda.RuntimeFamily.NODEJS),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../assets/api-processing.lambda')),
    });
    this.addEnvironment('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1', { removeInEdge: true });
  }
}
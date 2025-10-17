const { Stack, Duration, CfnOutput} = require('aws-cdk-lib');
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs');
const { Runtime } = require('aws-cdk-lib/aws-lambda');

class GeovictoriaMarkStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const geovictoriaLambda = new NodejsFunction(this, 'GeoVictoriaHandler', {
      functionName: 'geovictoria-mark-handler',
      entry: 'lambda/geovictoriaMark/index.js',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      memorySize: 1536,
      timeout: Duration.seconds(60),
      bundling: {
        target: 'node22',
        platform: 'node',
        nodeModules: ['@sparticuz/chromium', 'puppeteer-core'],
        externalModules: ['@aws-sdk/*', '@smithy/*'],
        sourcemap: true,
        minify: true,
        sourcesContent: false,
        legalComments: 'none'
      },
    });

    const fnUrl = geovictoriaLambda.addFunctionUrl({
      authType: 'NONE',
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['POST'],
        allowCredentials: false,
      },
    });

    new CfnOutput(this, 'GeoVictoriaFunctionUrl', {
      value: fnUrl.url,
      description: 'URL de la función Lambda para marcar asistencia en GeoVictoria',
    });
  }
}

module.exports = { GeovictoriaMarkStack }
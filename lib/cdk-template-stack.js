const { Stack, Duration } = require('aws-cdk-lib');
// const sqs = require('aws-cdk-lib/aws-sqs');

class CdkTemplateStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'CdkTemplateQueue', {
     visibilityTimeout: Duration.seconds(300)
    });
  }
}

module.exports = { CdkTemplateStack }

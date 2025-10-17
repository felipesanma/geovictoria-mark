#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { GeovictoriaMarkStack } = require('../lib/geovictoria-mark-stack');

const app = new cdk.App();
new GeovictoriaMarkStack(app, 'GeovictoriaMarkStack');

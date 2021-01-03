#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkStack } from '../lib/cdk-stack';
import * as dotenv from "dotenv";

dotenv.config({
    path: `${__dirname}/../envs/.env`
});
export const localEnvs = { 
    acmArn: process.env.acmArn! 
};

const app = new cdk.App();
new CdkStack(app, 'CdkStack', {
    // env: {
    //     region: process.env.CDK_DEFAULT_REGION,
    //     account: process.env.CDK_DEFAULT_ACCOUNT
    // },
    tags: {
        "Service": "myClientVpn"
    },
    // stackName: "myClientVpn"
});

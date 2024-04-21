import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NewAppStack } from '../lib/new-app-stack';
import {NewAppStackDns} from "../lib/new-app-stack-dns"
const domainNameApex = 'ali.xyz';           
const app = new cdk.App();

const {hostedZone, certificate}=new NewAppStackDns(app, 'NewAppStackDns',{
  dnsName:domainNameApex
});
new NewAppStack(app, 'NewAppStack',{dnsName:domainNameApex,hostedZone,certificate});

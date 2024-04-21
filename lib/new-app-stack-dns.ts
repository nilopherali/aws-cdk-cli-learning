import * as cdk from 'aws-cdk-lib';
import { Certificate, CertificateValidation, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { IPublicHostedZone, PublicHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';


interface NewAppStackDnsProps extends cdk.StackProps{
    dnsName: string
}

export class NewAppStackDns extends cdk.Stack {
    public readonly hostedZone: IPublicHostedZone
    public readonly certificate : ICertificate
  constructor(scope: Construct, id: string, props:NewAppStackDnsProps) {
    super(scope, id, props);
  this.hostedZone = new PublicHostedZone(this,"NewAppStackHostedZone",{
    zoneName:props.dnsName
  });
  this.certificate = new Certificate(this,"NewAppCertificateManager",{
    domainName:props.dnsName,
    validation:CertificateValidation.fromDns(this.hostedZone)
  })

    }
}
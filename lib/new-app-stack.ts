import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption,} from 'aws-cdk-lib/aws-s3';

import { BucketDeployment, } from 'aws-cdk-lib/aws-s3-deployment';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import path = require('path');
import { Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { DomainName, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
//import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Source } from 'aws-cdk-lib/aws-codebuild';
import { ARecord, IPublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontWebDistribution, Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';


declare const booksDefaultFn: cdk.aws_lambda.Function

interface NewAppStackProps extends cdk.StackProps{
  hostedZone:IPublicHostedZone
  certificate:ICertificate
  dnsName:string
}

export class NewAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props:NewAppStackProps) {
    super(scope, id, props);
  

    const bucket = new Bucket(this,"NewAppBucket",{
      encryption: BucketEncryption.S3_MANAGED 
      });

    // const websiteBucket = new Bucket(this, 'NewAppWebsiteBucket',{
    //   websiteIndexDocument: 'index.html',
    //   publicReadAccess: true 
    // })

    // Creates a distribution from an S3 bucket.

const cloudfront = new Distribution(this, 'NewAppDistribution', {
  defaultBehavior: { origin: new S3Origin(bucket) },
  domainNames:[props.dnsName],
  certificate: props.certificate
});


new ARecord(this, "NewAppARecordApex",{
  zone:props.hostedZone,
  target:RecordTarget.fromAlias(new CloudFrontTarget(cloudfront))

})

    //const cloudFront1 = new CloudFrontWebDistribution({
      //this,'NewAppDistribution',{
        //originConfigs:[
          //{
            //s3OriginSource:websiteBucket,
          //},
          //behavior:[{isDefaultBehavior:true}]
        //],
      //},
    //});


    // new BucketDeployment(this,'NewAppWebsiteDeploy',{
    //   sources:[s3Deployment.Source.asset(path.join(__dirname,  '..',  'frontend',  'build'))],
    //   destinationBucket:websiteBucket,
    // })


    new BucketDeployment(this,'newAppPhotos',{
      sources:[s3Deployment.Source.asset(path.join(__dirname, '..', 'photos'))],
      destinationBucket:bucket
    })


    // const cloudFront = new cdk.aws_cloudfront.CloudFrontWebDistribution(this,'NewAppDistribution',{
    //   originConfigs:[
    //     {
    //       customOriginSource:{
    //         domainName:bucket.bucketDomainName
    //       },
    //       behaviors: [{isDefaultBehavior:true}]
    //     }
    //   ]
    // })

    
    
     const getPhotos = new cdk.aws_lambda_nodejs.NodejsFunction(this,"MyNewLambda",{
      runtime:Runtime.NODEJS_18_X,
      entry:path.join(__dirname,"..","api","get-photos","index.ts"),
      handler:"getPhotos",
      environment:{
        PHOTO_BUCKET_NAME:bucket.bucketName
      },  
    });

    const bucketContainerPermission = new PolicyStatement();
    bucketContainerPermission.addResources(bucket.bucketArn);
    bucketContainerPermission.addActions('s3:ListBucket');

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketPermissions.addActions('s3:GetObject', 's3:PutObject');

    getPhotos.addToRolePolicy(bucketPermissions);
    getPhotos.addToRolePolicy(bucketContainerPermission);


    const httpApi = new HttpApi(this, 'MySimpleAppHttpApi',{
      corsPreflight:{
        allowOrigins: ['*'],
        allowMethods:[cdk.aws_apigatewayv2.CorsHttpMethod.GET]
      },
      apiName: 'photo-api',
      createDefaultStage: true
    })


    const LambdaIntegration = new HttpLambdaIntegration('photosIntegration', getPhotos);

    
    httpApi.addRoutes({
      path:'/getAllPhotos',
      methods: [
        HttpMethod.GET,
      ],
      integration: LambdaIntegration
    });
      

    new cdk.CfnOutput(this,"NewAppBucketNameExport",{
      value:bucket.bucketName,
      exportName:"NewAppBucketName"
    });

    // new cdk.CfnOutput(this,'NewAppBucketWebsiteBucketNameExport',{
    //   value: websiteBucket.bucketName,
    //   exportName: 'NewAppBucketWebsiteBucketName',
    // });

    // new cdk.CfnOutput(this,'NewAppWebsiteurl',{
    //   value:cloudFront.distributionDomainName,
    //   exportName: 'NewAppurl',
    // })


    new cdk.CfnOutput(this,"NewAppApi",{
      value:httpApi.url!,
      exportName: "NewAppApiEndPoint"
    });
  }
}
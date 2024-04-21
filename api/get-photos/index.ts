import {APIGatewayProxyEventV2,Context, APIGatewayProxyResultV2} from "aws-lambda"
import {S3} from "aws-sdk"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { objectToCloudFormation } from "aws-cdk-lib"
 import { CURRENT_VERSION_EXPIRED_FLAGS } from "aws-cdk-lib/cx-api"
 //import { Expires } from "@aws-cdk/aws-s3-deployment"
const bucketName = process.env.PHOTO_BUCKET_NAME
const s3 = new S3()

async function genearteUrl(Object:S3.Object): Promise<{fileName: string, url: string}> {
    const url = await s3.getSignedUrlPromise('getObject',{
        Bucket: bucketName,
        Key: Object.Key!,
        Expires: (24* 60* 60)
    })
    return{
        fileName: Object.Key!,
        url: url  
    }
}

async function getPhotos(event:APIGatewayProxyEventV2, context:Context): Promise<APIGatewayProxyResultV2> {
    console.log("BucketName" + bucketName);
    try{
        const { Contents: results } = await s3.listObjects({ Bucket: bucketName}).promise();
        console.log("results: ",results)
        const photos = await  Promise.all(results!.map((result) => genearteUrl(result)));
        

    
    return{
        statusCode: 200,
        body:JSON.stringify(photos),
    };
}
 
    catch(error:any){
        return {
            statusCode: 500,
            body: error.message,
        };

      
    }
         console.log("Error")
     return{
        statusCode:200,
         body:"Hello from lambda"
     }
}
export {getPhotos}
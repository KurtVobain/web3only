import { S3Client, S3ClientConfig, ListBucketsCommand } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv'

dotenv.config()

class S3Provider {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = this.#initS3Session();
    }

    #initS3Session(): S3Client {
        const endpoint = process.env.SCW_S3_ENDPOINT;
        const region = process.env.SCW_S3_REGION || 'us-east-1';
        const accessKeyId = process.env.SCW_S3_ACCESS_KEY;
        const secretAccessKey = process.env.SCW_S3_SECRET_KEY;

        if (!endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error('Missing required S3 configuration in environment variables.');
        }

        const s3ClientConfig: S3ClientConfig = {
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            endpoint,
        };

        return new S3Client(s3ClientConfig);
    }

    async listBuckets(): Promise<void> {
        try {
            const command = new ListBucketsCommand({});
            const response = await this.s3Client.send(command);
            
            if (response.Buckets) {
                console.log("S3 Buckets:");
                response.Buckets.forEach(bucket => {
                    console.log(`- ${bucket.Name}`);
                });
            } else {
                console.log("No buckets found.");
            }
        } catch (error) {
            console.error("Error fetching buckets:", error);
        }
    }

}

export default S3Provider;
const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

async function main() {
  try {
    await client.send(new CreateBucketCommand({ Bucket: process.env.S3_BUCKET }));
  } catch (error) {
    if (error.name !== 'BucketAlreadyOwnedByYou') throw error;
  }
  console.log('Private uploads bucket ready');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.destroy());

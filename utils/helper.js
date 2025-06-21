const validator = require('validator');

const { Upload } = require("@aws-sdk/lib-storage");
const { S3 } = require("@aws-sdk/client-s3");

const checkForStrongPassword = (password) => {
    return validator.isStrongPassword(password);
}

const uploadFileToS3 = async (
    fileBuffer,
    bucketName,
    key,
    mimeType
) => {
    const s3 = new S3({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
        },

        region: process.env.AWS_REGION,
    });
    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    }
    return new Upload({
        client: s3,
        params,
    }).done();
}

const getS3Url = (bucketName, region, key) => {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

module.exports = { checkForStrongPassword, uploadFileToS3, getS3Url };
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("../utils/sesClient");

const createSendEmailCommand = (
    toAddress,
    fromAddress,
    messageBodyHtmlBodyData,
    messageBodyHtmlTextData,
    subject
) => {
    return new SendEmailCommand({
        Destination: {
            /* required */
            CcAddresses: [
                /* more items */
            ],
            ToAddresses: [
                toAddress,
                /* more To-email addresses */
            ],
        },
        Message: {
            /* required */
            Body: {
                /* required */
                Html: {
                    Charset: "UTF-8",
                    Data: messageBodyHtmlBodyData,
                },
                Text: {
                    Charset: "UTF-8",
                    Data: messageBodyHtmlTextData,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: subject,
            },
        },
        Source: fromAddress,
        ReplyToAddresses: [
            /* more items */
        ],
    });
};

const run = async (
    toAddress,
    fromAddress,
    messageBodyHtmlBodyData,
    messageBodyHtmlTextData,
    subject
) => {
    const sendEmailCommand = createSendEmailCommand(
        toAddress,
        fromAddress,
        messageBodyHtmlBodyData,
        messageBodyHtmlTextData,
        subject
    );

    try {
        return await sesClient.send(sendEmailCommand);
    } catch (caught) {
        if (caught instanceof Error && caught.name === "MessageRejected") {
            /** @type { import('@aws-sdk/client-ses').MessageRejected} */
            const messageRejectedError = caught;
            return messageRejectedError;
        }
        throw caught;
    }
};

// snippet-end:[ses.JavaScript.email.sendEmailV3]
module.exports = { run };
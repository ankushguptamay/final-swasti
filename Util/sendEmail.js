import dotenv from "dotenv";
dotenv.config();

import { EmailCredential } from "../Model/User/emailCredentials.js";
import brevo from "@getbrevo/brevo";
import { SendMailClient } from "zeptomail";

const zeptoClient = new SendMailClient({
  url: process.env.ZEPTO_EMAIL_URL,
  token: process.env.ZEPTO_EMAIL_TOKEN,
});

async function finaliseEmailCredential() {
  // Update sendEmail 0 every day
  const date = JSON.stringify(new Date());
  const todayDate = `${date.slice(1, 11)}`;
  const changeUpdateDate = await EmailCredential.find({
    updatedAt: { $lt: new Date(todayDate) },
  })
    .select("_id")
    .lean();
  for (let i = 0; i < changeUpdateDate.length; i++) {
    await EmailCredential.updateOne(
      { _id: changeUpdateDate[i]._id },
      { $set: { emailSend: 0 } }
    );
  }
  // finalise email credentiel
  const emailCredentials = await EmailCredential.find()
    .sort({ updatedAt: 1 })
    .lean();
  let emailCredential;
  for (let i = 0; i < emailCredentials.length; i++) {
    if (parseInt(emailCredentials[i].emailSend) < 300) {
      emailCredential = emailCredentials[i];
      break;
    }
  }
  return emailCredential;
}

const sendEmailViaBrevo = async (options) => {
  return new Promise((resolve, reject) => {
    let defaultClient = brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = options.brevoKey;
    let apiInstance = new brevo.TransactionalEmailsApi();
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.sender = { name: "Swasti Bharat", email: options.brevoEmail };
    sendSmtpEmail.replyTo = {
      email: options.brevoEmail,
      name: "Swasti Bharat",
    };
    sendSmtpEmail.headers = options.headers;
    sendSmtpEmail.htmlContent = options.htmlContent;
    sendSmtpEmail.to = [{ email: options.userEmail, name: options.userName }];
    apiInstance.sendTransacEmail(sendSmtpEmail).then(
      function (data) {
        // console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        resolve(JSON.stringify(data));
      },
      function (error) {
        reject(error);
      }
    );
  });
};

// const options = {
//   senderMail: "",
//   senderName: "",
//   receiver: [{ receiverEmail: "", receiverName: "" }],
//   subject: "",
//   htmlbody: "",
// };
const sendEmailViaZeptoZoho = async (options) => {
  const receivers = [];
  for (let i = 0; i < options.receiver.length; i++) {
    receivers.push({
      email_address: {
        address: options.receiver[i].receiverEmail,
        name: options.receiver[i].receiverName,
      },
    });
  }
  return new Promise((resolve, reject) => {
    zeptoClient
      .sendMail({
        from: {
          address: options.senderMail,
          name: options.senderName,
        },
        to: receivers,
        subject: options.subject,
        htmlbody: options.htmlbody,
      })
      .then((resp) => {
        // console.log(resp);
        console.log("success");
        resolve();
      })
      .catch((error) => {
        console.log("error");
        reject(error);
      });
  });
};

export { sendEmailViaBrevo, finaliseEmailCredential, sendEmailViaZeptoZoho };

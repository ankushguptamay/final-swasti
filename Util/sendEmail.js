import { EmailCredential } from "../Model/User/emailCredentials.js";
import brevo from "@getbrevo/brevo";

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

const sendOTPToEmail = async (options) => {
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

export { sendOTPToEmail, finaliseEmailCredential };

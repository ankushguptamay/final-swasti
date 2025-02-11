import axios from "axios";
const {
  SMS_ROUTE_ID,
  SMS_CHANNEL,
  SMS_API_KEY,
  SMS_SENDER_ID,
  SMS_DLT_ENTITY_ID,
  SMS_DLT_TEMPLATE_ID,
} = process.env;

const sendOTPToNumber = async (mobileNumber, otp) => {
  try {
    const message = `${otp} is your login OTP for Swasti Bharat App. Do not share it with anyone. EUuwdQ6CNjz - SWASBT`;
    const response = await axios.post(
      `https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=${SMS_API_KEY}&senderid=${SMS_SENDER_ID}&channel=${SMS_CHANNEL}&DCS=0&flashsms=0&number=${mobileNumber}&text=${message}&route=${SMS_ROUTE_ID}&EntityId=${SMS_DLT_ENTITY_ID}&dlttemplateid=${SMS_DLT_TEMPLATE_ID}`
    );
    return response;
  } catch (e) {
    console.log("Something went wrong in sending SMS: ", e);
  }
};

export { sendOTPToNumber };

import dotenv from "dotenv";
dotenv.config();

const { PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, PHONEPE_CLIENT_ID } =
  process.env;

import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
  OrderStatusResponse,
} from "pg-sdk-node";

const clientId = PHONEPE_CLIENT_ID;
const clientSecret = PHONEPE_CLIENT_SECRET;
const clientVersion = PHONEPE_CLIENT_VERSION;
const env = Env.PRODUCTION; //change to Env.PRODUCTION when you go live

const APP_BE_URL = "https://shriramtechno.com/"; // our application

const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

async function createPayment() {
  try {
    const merchantOrderId = `ORDER_${Date.now()}`;
    const amount = 100;
    const redirectUrl = `${APP_BE_URL}/payment/status/${merchantOrderId}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await client.pay(request);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
}

export { createPayment };

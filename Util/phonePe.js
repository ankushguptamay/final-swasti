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

const APP_BE_URL = "https://yogawithisha.com"; // our application

const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

async function createPhonepePayment(amount, receipt) {
  const redirectUrl = `${APP_BE_URL}/api/auth/pub/verifyCoursePayment-ph/${receipt}`;
  const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(receipt)
    .amount(amount)
    .redirectUrl(redirectUrl)
    .build();

  const response = await client.pay(request);
  return response;
}

async function verifyPhonepePayment(merchantOrderId) {
  const response = await client.getOrderStatus(merchantOrderId);
  return response;
}

export { createPhonepePayment, verifyPhonepePayment };

import dotenv from "dotenv";
dotenv.config();

import { convertGivenTimeZoneToUTC } from "../../../Util/timeZone.js";
import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";

import { generateReceiptNumber } from "../../../Helper/generateOTP.js";
import { User } from "../../../Model/User/Profile/userModel.js";
import { ServiceOrder } from "../../../Model/User/Services/serviceOrderModel.js";
import { YogaTutorClass } from "../../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
const { SERVICE_OFFER, RAZORPAY_KEY_ID, RAZORPAY_SECRET_ID, PLATFROM_FEE } =
  process.env;
import Razorpay from "razorpay";
import { purchaseServiceValidation } from "../../../MiddleWare/Validation/slots.js";
import crypto from "crypto";
import { Wallet } from "../../../Model/User/Profile/walletModel.js";
import { UserTransaction } from "../../../Model/User/Profile/transactionModel.js";
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_ID,
});

const createPayment = async (req, res) => {
  try {
    // Validate body
    const { error } = purchaseServiceValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { service, serviceId, currency, numberOfPeople } = req.body;
    const amount = req.body.amount / 100;
    // Check Availablity
    let instructor;
    if (service.toLowerCase() === "yogatutorclass") {
      const ytc = await YogaTutorClass.findOne({
        _id: serviceId,
        isDelete: false,
        approvalByAdmin: "accepted",
      }).lean();
      if (!ytc)
        return failureResponse(
          res,
          400,
          "This yoga tutor class is not present.",
          null
        );
      // Validate time
      const classDatesTimeInUTC = await convertGivenTimeZoneToUTC(
        `${ytc.startDate.toISOString().split("T")[0]}T${ytc.time}:00.000`,
        ytc.instructorTimeZone
      );
      const dateObject = new Date(
        classDatesTimeInUTC.replace(" ", "T") + ".000Z"
      ).getTime();
      if (new Date().getTime() + 24 * 60 * 60 * 1000 > dateObject) {
        return failureResponse(
          res,
          400,
          "Please book a yoga tutor class atlest 24 hours before starting time.",
          null
        );
      }
      // Calculate Offer
      const offeredPricePerPerson = Math.floor(
        (parseInt(ytc.price) * parseInt(SERVICE_OFFER)) / 100
      );
      if (ytc.classType === "individual") {
        // Individual
        if (ytc.isBooked) {
          return failureResponse(
            res,
            400,
            "Oops! This yoga tutor class has already booked.",
            null
          );
        } else {
          // Amount Verification
          if (amount !== parseInt(ytc.price) - offeredPricePerPerson) {
            return failureResponse(res, 400, "Unsufficient amount.", null);
          } else {
            instructor = ytc.instructor;
          }
        }
        // Group
      } else {
        // Check How much seat available
        const totalAvailableSeats =
          parseInt(ytc.numberOfSeats) - parseInt(ytc.totalBookedSeat);
        if (numberOfPeople > totalAvailableSeats) {
          return failureResponse(
            res,
            400,
            `Only ${totalAvailableSeats} seat are available.`,
            null
          );
        }
        // Amount Verification
        if (
          amount / numberOfPeople !==
          parseInt(ytc.price) - offeredPricePerPerson
        ) {
          return failureResponse(res, 400, "Unsufficient amount.", null);
        } else {
          instructor = ytc.instructor;
        }
      }
    } else {
      return failureResponse(
        res,
        400,
        "This service is not supported by Swasti Bharat.",
        null
      );
    }
    const userId = req.user._id;
    const receipt = await generateReceiptNumber("ytc");
    // initiate payment
    razorpayInstance.orders.create(
      { amount: amount * 100, currency, receipt },
      (err, order) => {
        if (!err) {
          ServiceOrder.create({
            learner: userId,
            instructor,
            service,
            serviceId,
            amount,
            razorpayOrderId: order.id,
            numberOfBooking: numberOfPeople,
            receipt,
          })
            .then(() => {
              return successResponse(
                res,
                201,
                `Order craeted successfully!`,
                order
              );
            })
            .catch((err) => {
              return failureResponse(res, 500, err.message);
            });
        } else {
          return failureResponse(res, 500, err.message);
        }
      }
    );
  } catch (err) {
    return failureResponse(res, 500, err.message);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const paymentId = req.body.paymentId;
    const razorpay_signature = req.body.razorpay_signature;
    // Creating hmac object
    let hmac = crypto.createHmac("sha256", RAZORPAY_SECRET_ID);
    // Passing the data to be hashed
    hmac.update(orderId + "|" + paymentId);
    // Creating the hmac in the required format
    const generated_signature = hmac.digest("hex");

    if (razorpay_signature === generated_signature) {
      const purchase = await ServiceOrder.findOne({
        razorpayOrderId: orderId,
      });
      if (!purchase) {
        return failureResponse(res, 400, "Order does not exist!");
      }
      if (!purchase.verify && purchase.status === "pending") {
        // Get Service
        let instructor = "";
        let amount = 0;
        if (purchase.service === "yogatutorclass") {
          const yogaTutor = await YogaTutorClass.findOne({
            _id: purchase.serviceId,
            isDelete: false,
            approvalByAdmin: "accepted",
          });
          if (!yogaTutor) {
            return failureResponse(res);
          } else {
            const totalBookedSeat =
              parseInt(yogaTutor.totalBookedSeat) +
              parseInt(purchase.numberOfBooking);
            const serviceOrder = [...yogaTutor.serviceOrder, purchase._id];
            await yogaTutor.updateOne({
              $set: { totalBookedSeat, isBooked: true, serviceOrder },
            });
            instructor = yogaTutor.instructor;
            amount =
              amount +
              purchase.amount -
              (purchase.amount * parseInt(PLATFROM_FEE)) / 100;
          }
        } else {
          return failureResponse(res);
        }
        // Update wallet amount
        const wallet = await Wallet.findOne({
          userId: instructor,
          status: "active",
        });
        // Transaction in Wallet
        const transaction = await UserTransaction.create({
          wallet: wallet._id,
          serviceOrder: purchase._id,
          user: wallet.userId,
          amount,
          paymentType: "credit",
          reason: "servicebooked",
          status: "completed",
        });
        // Updatae wallet
        const transactions = [...wallet.transactions, transaction._id];
        await wallet.updateOne({
          $set: { transactions, $inc: { balance: amount } },
        });
        // Update Purchase
        await purchase.updateOne({
          $set: {
            status: "completed",
            razorpayPaymentId: paymentId,
            verify: true,
          },
        });
      }
      return successResponse(res, 201, "Payment has been verified");
    } else {
      return failureResponse(res, 400, "Payment verification failed");
    }
  } catch (err) {
    return failureResponse(res, 500, err.message);
  }
};

export { createPayment, verifyPayment };

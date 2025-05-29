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
const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_ID } = process.env;
import Razorpay from "razorpay";
import { purchaseServiceValidation } from "../../../MiddleWare/Validation/slots.js";
import crypto from "crypto";
import { Wallet } from "../../../Model/User/Profile/walletModel.js";
import { UserTransaction } from "../../../Model/User/Profile/transactionModel.js";
import {
  CANCELLATION_CHARGE,
  PLATFROM_FEE,
  SERVICE_OFFER,
  CANCELLATION_BONUS_INSTRUCTOR,
  CLASS_CANCELATION_TIME,
  CLASS_BOOKING_TIME,
} from "../../../Config/class.const.js";
import { YTClassDate } from "../../../Model/User/Services/YogaTutorClass/yTClassDatesModel.js";
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
      if (
        new Date().getTime() + parseInt(CLASS_BOOKING_TIME) * 60 * 60 * 1000 >
        dateObject
      ) {
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
          return failureResponse(res, 400, "This slot is already booked", null);
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
              return failureResponse(res);
            });
        } else {
          return failureResponse(res);
        }
      }
    );
  } catch (err) {
    return failureResponse(res);
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
          }).lean();
          if (!yogaTutor) {
            return failureResponse(res);
          } else {
            const totalBookedSeat =
              parseInt(yogaTutor.totalBookedSeat) +
              parseInt(purchase.numberOfBooking);
            const serviceOrder = [...yogaTutor.serviceOrder, purchase._id];
            await YogaTutorClass.updateOne(
              { _id: yogaTutor._id },
              {
                $set: {
                  totalBookedSeat,
                  isBooked: true,
                  serviceOrder,
                },
              }
            );
            await YTClassDate.updateMany(
              { yogaTutorClass: yogaTutor._id },
              { $set: { classStatus: "upcoming" } }
            );
            instructor = yogaTutor.instructor;
            amount =
              amount +
              parseInt(yogaTutor.price) * parseInt(purchase.numberOfBooking) -
              (parseInt(yogaTutor.price) *
                parseInt(purchase.numberOfBooking) *
                parseInt(PLATFROM_FEE)) /
                100;
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
          reference: purchase.receipt,
        });
        // Updatae wallet
        const transactions = [...wallet.transactions, transaction._id];
        await wallet.updateOne({
          $set: { transactions },
          $inc: { balance: amount },
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
      return successResponse(res, 201, "Payment successful.");
    } else {
      return failureResponse(res, 400, "Payment failed. Please try again.");
    }
  } catch (err) {
    return failureResponse(res);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const _id = req.params.id;
    const serviceOrder = await ServiceOrder.findOne({
      _id,
      learner: req.user._id,
      status: "completed",
      verify: true,
    });
    if (!serviceOrder)
      return failureResponse(res, 400, "This order is not present!");
    // Yoga Tutor
    if (serviceOrder.service.toLowerCase() === "yogatutorclass") {
      const ytc = await YogaTutorClass.findOne({
        _id: serviceOrder.serviceId,
        isDelete: false,
        isBooked: true,
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
      const UTCFormate = new Date(ytc.classStartTimeInUTC).getTime();
      let refundAmountForuser = 0,
        debitAmountForInstructor =
          parseInt(ytc.price) * parseInt(serviceOrder.numberOfBooking) -
          (parseInt(ytc.price) *
            parseInt(serviceOrder.numberOfBooking) *
            parseInt(PLATFROM_FEE)) /
            100,
        creditAmountForInstructor = 0;
      if (new Date().getTime() > UTCFormate) {
        return failureResponse(res, 400, "Can not cancel this order.");
      } else if (
        new Date().getTime() +
          parseInt(CLASS_CANCELATION_TIME) * 60 * 60 * 1000 >
          UTCFormate &&
        UTCFormate >= new Date().getTime()
      ) {
        // Some charges
        refundAmountForuser =
          parseFloat(serviceOrder.amount) -
          (parseFloat(serviceOrder.amount) * parseInt(CANCELLATION_CHARGE)) /
            100;
        creditAmountForInstructor =
          (parseFloat(serviceOrder.amount) *
            parseInt(CANCELLATION_BONUS_INSTRUCTOR)) /
          100;
      } else {
        // Full refund
        refundAmountForuser = serviceOrder.amount;
      }
      // Transation for user Wallet
      const userWallet = await Wallet.findOne({ userId: req.user._id });
      const reference1 = await generateReceiptNumber("ytc");
      const userTransaction = await UserTransaction.create({
        wallet: userWallet._id,
        serviceOrder: serviceOrder._id,
        user: req.user._id,
        amount: refundAmountForuser,
        paymentType: "credit",
        reason: "servicecancelled",
        status: "completed",
        reference: reference1,
      });
      // Update user wallet
      await Wallet.updateOne(
        { _id: userWallet._id },
        {
          $push: { transactions: userTransaction._id },
          $inc: { balance: refundAmountForuser },
        }
      );
      // Transation for instructor Wallet
      const instructorWallet = await Wallet.findOne({
        userId: serviceOrder.instructor,
      });
      const reference2 = await generateReceiptNumber("ytc");
      const firstITransaction = await UserTransaction.create({
        wallet: instructorWallet._id,
        serviceOrder: serviceOrder._id,
        user: serviceOrder.instructor,
        amount: debitAmountForInstructor,
        paymentType: "debit",
        reason: "servicecancelled",
        status: "completed",
        reference: reference2,
      });
      const transactions = [firstITransaction._id];
      if (creditAmountForInstructor > 0) {
        const reference3 = await generateReceiptNumber("ytc");
        const secondITransaction = await UserTransaction.create({
          wallet: instructorWallet._id,
          serviceOrder: serviceOrder._id,
          user: serviceOrder.instructor,
          amount: creditAmountForInstructor,
          paymentType: "credit",
          reason: "servicecancelled",
          status: "completed",
          reference: reference3,
        });
        transactions.push(secondITransaction._id);
      }
      // Update user wallet
      await Wallet.updateOne(
        { _id: instructorWallet._id },
        {
          $push: { transactions: { $each: transactions } },
          $inc: {
            balance: -(debitAmountForInstructor - creditAmountForInstructor),
          },
        }
      );
      let isBooked = false,
        classStatus = null;
      if (ytc.classType === "group") {
        const newSeat =
          parseInt(ytc.totalBookedSeat) -
          parseInt(serviceOrder.numberOfBooking);
        isBooked = newSeat < 1 ? false : true;
        classStatus = newSeat < 1 ? null : "upcoming";
      }
      // Update Yoga tutor class
      await YogaTutorClass.updateOne(
        { _id: ytc._id },
        {
          $set: { isBooked },
          $inc: { totalBookedSeat: -serviceOrder.numberOfBooking },
          $pull: { serviceOrder: serviceOrder._id },
        }
      );
      await YTClassDate.updateMany(
        { yogaTutorClass: ytc._id },
        { $set: { classStatus } }
      );
      // Update Serive Order
      await ServiceOrder.updateOne(
        { _id: serviceOrder._id },
        { $set: { status: "cancelled" } }
      );
    } else {
      return failureResponse(res);
    }
    return successResponse(res, 200, "Oder cancelled successfully.");
  } catch (err) {
    return failureResponse(res);
  }
};

export { createPayment, verifyPayment, cancelOrder };

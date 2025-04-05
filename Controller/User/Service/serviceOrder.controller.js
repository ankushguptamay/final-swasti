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
const { SERVICE_OFFER, RAZORPAY_KEY_ID, RAZORPAY_SECRET_ID } = process.env;
import Razorpay from "razorpay";
import { purchaseServiceValidation } from "../../../MiddleWare/Validation/slots.js";
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_ID,
});

const createPayment = async (req, res) => {
  try {
    // Validate body
    const { error } = purchaseServiceValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { service, serviceId, amount, currency, numberOfPeople } = req.body;
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
        `${ytc.startDate.toISOString().split("T")[0]}T${times.time}:00.000`,
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
      { amount, currency, receipt },
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

// const verifyPaymentForRegisterUser = async (req, res) => {
//   try {
//     const orderId = req.body.razorpay_order_id;
//     const paymentId = req.body.razorpay_payment_id;
//     const razorpay_signature = req.body.razorpay_signature;
//     // Creating hmac object
//     let hmac = crypto.createHmac("sha256", RAZORPAY_SECRET_ID);
//     // Passing the data to be hashed
//     hmac.update(orderId + "|" + paymentId);
//     // Creating the hmac in the required format
//     const generated_signature = hmac.digest("hex");

//     if (razorpay_signature === generated_signature) {
//       const purchase = await User_Course.findOne({
//         where: {
//           razorpayOrderId: orderId,
//           verify: false,
//           status: "created",
//         },
//       });
//       if (!purchase) {
//         return res.status(200).json({
//           success: true,
//           message: "Payment has been verified! Second Time!",
//         });
//       }
//       // Get Course
//       const course = await Course.findOne({
//         where: {
//           id: purchase.courseId,
//         },
//       });
//       // Get Marketing Ratio, if course does not have any ratio id then we get a "GENERAL"(ratioName) ratio
//       let ratio;
//       if (course.ratioId) {
//         ratio = await AffiliateMarketingRatio.findOne({
//           where: {
//             id: course.ratioId,
//           },
//         });
//       } else {
//         ratio = await AffiliateMarketingRatio.findOne({
//           where: {
//             ratioName: "GENERAL",
//           },
//         });
//       }
//       // find Referal Wallet
//       let referalWallet;
//       if (purchase.referalId) {
//         const referalUserWallet = await UserWallet.findOne({
//           where: {
//             userId: purchase.referalId,
//           },
//         });
//         const referalAdminWallet = await AdminWallet.findOne({
//           where: {
//             adminId: purchase.referalId,
//           },
//         });
//         if (referalUserWallet) {
//           referalWallet = referalUserWallet;
//         } else {
//           referalWallet = referalAdminWallet;
//         }
//       }
//       // Get Course Owner wallet
//       const courseOwnerWallet = await AdminWallet.findOne({
//         where: {
//           adminId: course.adminId,
//         },
//       });
//       // Transfer money to Course Owenr Wallet
//       const adminWalletAmount =
//         parseFloat(courseOwnerWallet.amount) +
//         (parseFloat(purchase.amount) * parseFloat(ratio.adminRatio)) / 100;
//       await courseOwnerWallet.update({
//         amount: Math.round(adminWalletAmount * 100) / 100,
//       });
//       // Transfer money to Referal Wallet, if referal is not present then tranfer it to course admin wallet
//       if (referalWallet) {
//         const referalAmount =
//           parseFloat(referalWallet.amount) +
//           (parseFloat(purchase.amount) * parseFloat(ratio.referalRatio)) / 100;
//         await referalWallet.update({
//           amount: Math.round(referalAmount * 100) / 100,
//         });
//       } else {
//         const referalAmount =
//           parseFloat(courseOwnerWallet.amount) +
//           (parseFloat(purchase.amount) * parseFloat(ratio.referalRatio)) / 100;
//         // (Math.round(referalAmount * 100) / 100).toFixed(2)
//         await courseOwnerWallet.update({
//           amount: Math.round(referalAmount * 100) / 100,
//         });
//       }
//       // Update Purchase
//       await purchase.update({
//         ...purchase,
//         status: "paid",
//         razorpayPaymentId: paymentId,
//         verify: true,
//       });
//       res.status(200).json({
//         success: true,
//         message: "Payment has been verified",
//       });
//     } else {
//       res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }
//   } catch (err) {
//     res.status(500).send({
//       success: false,
//       err: err.message,
//     });
//   }
// };

export { createPayment };

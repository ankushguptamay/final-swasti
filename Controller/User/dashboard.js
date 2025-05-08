import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { UserTransaction } from "../../Model/User/Profile/transactionModel.js";
import { User } from "../../Model/User/Profile/userModel.js";
import { YogaTutorClass } from "../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import { convertUTCToGivenTimeZone } from "../../Util/timeZone.js";

const instructorDashBoard = async (req, res) => {
  try {
    const { daysForClass, daysForEarning } = req.query;
    const daysIntClass = parseInt(daysForClass) || 1;
    const daysIntTrans = parseInt(daysForEarning) || 1;
    // Get datetime according to user
    const classDatesTimeInZone = await convertUTCToGivenTimeZone(
      new Date(),
      req.user.userTimeZone
    );
    // condition for class times
    const today = new Date(classDatesTimeInZone.replace(" ", "T") + ".000Z");
    today.setUTCHours(0, 0, 0, 0);
    const future = new Date(
      today.getTime() + daysIntClass * 24 * 60 * 60 * 1000
    );
    future.setUTCHours(23, 59, 59, 999);
    // Past date for transation
    const pastDate = new Date(
      today.getTime() - daysIntTrans * 24 * 60 * 60 * 1000
    );
    pastDate.setUTCHours(0, 0, 0, 0);
    // Query
    const queryForClass = {
      instructor: req.user._id,
      isDelete: false,
      approvalByAdmin: "accepted",
      isBooked: true,
      datesOfClasses: {
        $elemMatch: {
          date: { $gte: today, $lte: future },
          classStatus: "upcoming",
        },
      },
    };
    const queryForTrans = {
      user: req.user._id,
      isDelete: false,
      reason: { $in: ["servicebooked", "servicecancelled"] },
      status: "completed",
      createdAt: { $gt: pastDate, $lt: today },
    };
    // Get required data
    const [classes, transactions, user] = await Promise.all([
      YogaTutorClass.countDocuments(queryForClass),
      UserTransaction.find(queryForTrans).select("amount paymentType").lean(),
      User.findById(req.user._id).select("averageRating").lean(),
    ]);
    let totalEarning = 0;
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].paymentType === "credit") {
        totalEarning = totalEarning + transactions[i].amount;
      } else {
        totalEarning = totalEarning - transactions[i].amount;
      }
    }
    // Send final success response
    return successResponse(res, 200, "Successfully", {
      classes,
      totalEarning,
      rating: user.averageRating,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export { instructorDashBoard };

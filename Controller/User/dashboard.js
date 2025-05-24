import { MEET_CAN_JOIN_BEFORE } from "../../Config/class.const.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { YogaCategory } from "../../Model/Master/yogaCategoryModel.js";
import { UserTransaction } from "../../Model/User/Profile/transactionModel.js";
import { User } from "../../Model/User/Profile/userModel.js";
import { YogaTutorClass } from "../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import { YTClassDate } from "../../Model/User/Services/YogaTutorClass/yTClassDatesModel.js";

const instructorDashBoard = async (req, res) => {
  try {
    const { daysForClass, daysForEarning } = req.query;
    const daysIntClass = parseInt(daysForClass) || 1;
    const daysIntTrans = parseInt(daysForEarning) || 1;
    // condition for class times
    const today = new Date(
      new Date().getTime() - parseInt(MEET_CAN_JOIN_BEFORE) * 60 * 1000
    );
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
      startDateTimeUTC: { $gte: today, $lte: future },
      classStatus: "upcoming",
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
      YTClassDate.countDocuments(queryForClass),
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

const recordForHero = async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];
    // Query
    const queryForClass = {
      classStartTimeInUTC: { $gte: new Date(date) },
      isDelete: false,
      approvalByAdmin: "accepted",
    };
    // Get required data
    const [classes, learner, instructor, yogaCategories] = await Promise.all([
      YogaTutorClass.countDocuments(queryForClass),
      User.countDocuments({ role: "learner" }),
      User.countDocuments({ role: "instructor" }),
      YogaCategory.countDocuments(),
    ]);
    // Send final success response
    return successResponse(res, 200, "Successfully", {
      classes,
      learner,
      instructor,
      yogaCategories,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export { instructorDashBoard, recordForHero };

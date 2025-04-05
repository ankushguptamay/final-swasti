import dotenv from "dotenv";
dotenv.config();

import {
  compareArrays,
  getOldValues,
} from "../../../../Helper/formatChange.js";
import { generateFixedLengthRandomNumber } from "../../../../Helper/generateOTP.js";
import {
  failureResponse,
  successResponse,
} from "../../../../MiddleWare/responseMiddleware.js";
import {
  validateUpdateYTClassTimes,
  validateYTClassTimes,
  validateApprovalClassTimes,
} from "../../../../MiddleWare/Validation/slots.js";
import { User } from "../../../../Model/User/Profile/userModel.js";
import { YTClassUpdateHistory } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorClassHistoryModel.js";
import { YogaTutorClass } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import {
  convertGivenTimeZoneToUTC,
  getDatesDay,
} from "../../../../Util/timeZone.js";

// Helper
async function isOverlapping(existingSlots, newOne) {
  for (let slot of existingSlots) {
    // Convert time strings to minutes since start of the day
    const [slotHour, slotMinute] = slot.time.split(":").map(Number);
    const slotStartMinutes = slotHour * 60 + slotMinute;
    const slotEndMinutes = slotStartMinutes + slot.timeDurationInMin;

    const [newHour, newMinute] = newOne.time.split(":").map(Number);
    const newStartMinutes = newHour * 60 + newMinute;
    const newEndMinutes = newStartMinutes + newOne.timeDurationInMin;

    // Convert date strings to Date objects & get timestamps
    const slotDatesInMs = slot.datesOfClasses.map((date) =>
      new Date(date).getTime()
    );
    const newDatesInMs = newOne.datesOfClasses.map((date) =>
      new Date(date).getTime()
    );

    // Check if there is any overlapping date
    const hasDateOverlap = slotDatesInMs.some((dateMs) =>
      newDatesInMs.includes(dateMs)
    );

    // Check if time ranges overlap
    const hasTimeOverlap =
      newStartMinutes < slotEndMinutes && newEndMinutes > slotStartMinutes;

    if (hasDateOverlap && hasTimeOverlap) {
      return true; // Overlap detected
    }
  }
  return false; // No overlap
}

async function filterQueryOfClassForUser(data) {
  const {
    mOC, // modeOfClass,
    cT = "individual", // classType,
    search,
    date = new Date().toISOString().split("T")[0], // Default today
    timing,
    pt, // packageType
    miP = 500, // minimumPrice,
    maP = 100000, // maximumPrice,
  } = data;
  // Find Instructor Whose education, profilePic present
  const instructorArray = await User.distinct("_id", {
    role: "instructor",
    $expr: { $gte: [{ $size: "$education" }, 1] },
    "profilePic.url": { $exists: true, $ne: null, $ne: "" },
  });
  // Query
  const query = {
    instructor: { $in: instructorArray },
    isDelete: false,
    approvalByAdmin: "accepted",
  };
  // Search
  if (search) {
    const containInString = new RegExp(search, "i");
    query.$or = [
      { packageType: containInString },
      { classType: containInString },
      { modeOfClass: containInString },
      { description: containInString },
    ];
  }
  // Filter
  if (mOC) query.modeOfClass = mOC;
  if (date) query.startDate = { $gte: new Date(date) };
  if (timing) query.time = timing;
  query.classType = cT;
  // Price
  query.$expr = {
    $and: [
      { $gte: [{ $divide: ["$price", "$numberOfClass"] }, miP] },
      { $lte: [{ $divide: ["$price", "$numberOfClass"] }, maP] },
    ],
  };
  return query;
}

// Main Controller
const addNewClassTimes = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    // Validate again

    const {
      modeOfClass,
      classType,
      time,
      description,
      timeDurationInMin,
      numberOfSeats,
      numberOfClass,
      packageType,
      price,
      datesOfClasses,
      yogaCategory,
      yTRequirement,
      yTRule,
    } = req.body;
    // Price
    if (Math.ceil(price / numberOfClass) < 500)
      return failureResponse(
        res,
        400,
        "Price for individual person per day should be greater then 500.",
        null
      );
    if (numberOfClass !== datesOfClasses.length)
      return failureResponse(res, 400, "Select all dates!", null);
    // date
    const today = new Date().toISOString().split("T")[0];
    const hasPastDate = datesOfClasses.some(
      (date) => new Date(date).getTime() < new Date(today).getTime()
    );
    if (hasPastDate)
      return failureResponse(res, 400, "Some dates are in the past!", null);
    if (
      (packageType.toLowerCase() === "daily" && numberOfClass === 1) ||
      (packageType.toLowerCase() === "weekly" &&
        numberOfClass >= 2 &&
        numberOfClass <= 7) ||
      (packageType.toLowerCase() === "monthly" &&
        numberOfClass >= 8 &&
        numberOfClass <= 28)
    ) {
    } else {
      return failureResponse(
        res,
        400,
        "Package type and classes are not matching.",
        null
      );
    }
    const dateObjects = datesOfClasses.map((date) => new Date(date).getTime());
    // Find the smallest (earliest) and greatest (latest) timestamp
    const startDate = new Date(Math.min(...dateObjects));
    const endDate = new Date(Math.max(...dateObjects));

    // Find all ongoing times
    const defaultToday = new Date().toISOString().split("T")[0];
    const existingOnGoingTimes = await YogaTutorClass.find({
      instructor: req.user._id,
      isDelete: false,
      endDate: { $gte: new Date(defaultToday) },
    })
      .select("time startDate endDate timeDurationInMin datesOfClasses")
      .lean();
    const newTime = { time, timeDurationInMin, datesOfClasses };
    // trans form Change
    const existingTimes = existingOnGoingTimes.map((times) => {
      return {
        time: times.time,
        timeDurationInMin: times.timeDurationInMin,
        datesOfClasses: times.datesOfClasses.map((dates) => dates.date),
      };
    });
    // Is over lapping present
    const checkOverLap = await isOverlapping(existingTimes, newTime);
    const overLapMessage =
      "This time slot overlaps with an existing time slot. Please view existing time slots!";
    if (checkOverLap) return failureResponse(res, 400, overLapMessage);
    // Password
    const password = generateFixedLengthRandomNumber(
      process.env.OTP_DIGITS_LENGTH
    );
    const dateObject = datesOfClasses.map((dates) => {
      return { date: new Date(dates), meetingLink: null };
    });
    // Create Yoga class
    await YogaTutorClass.create({
      instructorTimeZone: req.user.userTimeZone,
      modeOfClass,
      classType,
      password,
      time,
      yogaCategory: yogaCategory?.length > 0 ? yogaCategory : [],
      yTRequirement: yTRequirement?.length > 0 ? yTRequirement : [],
      yTRule: yTRule?.length > 0 ? yTRule : [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      datesOfClasses: dateObject,
      numberOfSeats,
      numberOfClass,
      packageType,
      price,
      description,
      timeDurationInMin,
      instructor: req.user._id,
    });

    const message = "Time slot has been created successfully.";
    // Send final success response
    return successResponse(res, 201, message);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const classTimesForInstructor = async (req, res) => {
  try {
    const {
      modeOfClass,
      classType,
      search,
      approvalByAdmin = "accepted",
    } = req.query;
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Query
    const query = { instructor: req.user._id, isDelete: false };
    // Search
    if (search) {
      const containInString = new RegExp(req.query.search, "i");
      query.$or = [
        { classType: containInString },
        { modeOfClass: containInString },
        { description: containInString },
      ];
    }
    // Filter
    if (modeOfClass) {
      query.modeOfClass = modeOfClass;
    }
    if (classType) {
      query.classType = classType;
    }
    query.approvalByAdmin = approvalByAdmin;
    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YogaTutorClass.find(query)
        .select(
          "_id modeOfClass classType startDate endDate price time timeDurationInMin approvalByAdmin instructorTimeZone createdAt"
        )
        .sort({ startDate: -1, endDate: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      YogaTutorClass.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalClasses / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, "Successfully", {
      data: classes,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const updateYTClassTimes = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUpdateYTClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    // Body
    const {
      price,
      yogaCategory = [],
      yTRequirement = [],
      yTRule = [],
    } = req.body;
    const _id = req.params.id;
    // Find record
    const classes = await YogaTutorClass.findOne({
      _id,
      instructor: req.user._id,
      isDelete: false,
    }).select("price yogaCategory yTRequirement yTRule numberOfClass isBooked");
    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Only Non booked class can update
    if (classes.isBooked)
      return failureResponse(
        res,
        400,
        "A booked yoga class can not be update.",
        null
      );
    // Get Changed field
    const changedField = {};
    // Price
    if (price !== classes._doc.price) {
      if (Math.ceil(price / classes.numberOfClass) < 500) {
        return failureResponse(
          res,
          400,
          "Price for individual person per day should be greater then 500.",
          null
        );
      } else {
        changedField.price = price;
      }
    }
    //  Yoga Tutor category
    const existingCategory = classes._doc.yogaCategory.map((eve) =>
      eve.toString()
    );
    const isEqualCategory = await compareArrays(
      yogaCategory.sort(),
      existingCategory.sort()
    );
    if (!isEqualCategory) {
      changedField.yogaCategory = yogaCategory;
    }
    // Requirement
    const existingRequirement = classes._doc.yTRequirement
      ? classes._doc.yTRequirement.map((eve) => eve.toString())
      : [];
    const isEqualRequirement = await compareArrays(
      yTRequirement.sort(),
      existingRequirement.sort()
    );
    if (!isEqualRequirement) changedField.yTRequirement = yTRequirement;
    // Rule
    const existingRule = classes._doc.yTRule
      ? classes._doc.yTRule.map((eve) => eve.toString())
      : [];
    const isEqualRule = await compareArrays(yTRule.sort(), existingRule.sort());
    if (!isEqualRule) changedField.yTRule = yTRule;
    // update record accordingly
    if (classes._doc.approvalByAdmin === "accepted") {
      // Update Class
      await classes.updateOne({ $set: { ...changedField } });
      // Create new history
      if (Object.entries(changedField).length !== 0) {
        await YTClassUpdateHistory.create({
          ...changedField,
          yogaTutorClass: _id,
        });
      }
    } else {
      await classes.updateOne({
        $set: { ...changedField, approvalByAdmin: "pending" },
      });
    }
    // Send final success response
    return successResponse(res, 201, "Updated Successfully!");
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteYTClassTimes = async (req, res) => {
  try {
    const _id = req.params.id;
    // Find record
    const classes = await YogaTutorClass.findOne({
      _id,
      instructor: req.user._id,
      isDelete: false,
    }).select("isBooked");
    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Only Non booked class can delete
    if (classes.isBooked)
      return failureResponse(
        res,
        400,
        "A booked yoga class can not be delete.",
        null
      );
    // Update Class to soft delete
    await classes.updateOne({
      $set: { isDelete: true, deleted_at: new Date() },
    });
    // Send final success response
    return successResponse(res, 201, "Updated Successfully!");
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const classTimesForAdmin = async (req, res) => {
  try {
    const {
      modeOfClass,
      classType,
      search,
      approvalByAdmin = "pending",
    } = req.query;
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Query
    const query = { isDelete: false };
    // Search
    if (search) {
      const containInString = new RegExp(req.query.search, "i");
      query.$or = {
        classType: containInString,
        modeOfClass: containInString,
        description: containInString,
      };
    }
    // Filter
    if (modeOfClass) {
      query.modeOfClass = modeOfClass;
    }
    if (classType) {
      query.classType = classType;
    }
    query.approvalByAdmin = approvalByAdmin;
    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YogaTutorClass.find(query)
        .select(
          "_id modeOfClass classType startDate endDate time price timeDurationInMin description approvalByAdmin createdAt"
        )
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      YogaTutorClass.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalClasses / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, "Successfully", {
      data: classes,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const approvalClassTimes = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateApprovalClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const approvalByAdmin = req.body.approvalByAdmin;
    const _id = req.params.id;
    // Find record
    const classes = await YogaTutorClass.findOne({
      _id,
      isDelete: false,
    }).select("approvalByAdmin yogaCategory yTRequirement yTRule price");
    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Save History
    if (approvalByAdmin === "accepted") {
      await YTClassUpdateHistory.create({
        yogaCategory: classes.yogaCategory,
        price: classes.price,
        yTRequirement: classes.yTRequirement,
        yTRule: classes.yTRule,
        yogaTutorClass: _id,
      });
    }
    // Save
    await classes.updateOne({ $set: { approvalByAdmin } });
    // Send final success response
    return successResponse(res, 201, `Class ${approvalByAdmin} successfully`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const classTimesDetailsForInstructor = async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      instructor: req.user._id,
      isDelete: false,
    };
    // Get required data
    const classes = await YogaTutorClass.findOne(query)
      .select(
        "_id modeOfClass classType startDate endDate time description price timeDurationInMin numberOfSeats numberOfClass packageType datesOfClasses approvalByAdmin createdAt"
      )
      .populate("yogaCategory", "yogaCategory description")
      .populate("yTRule", "rule")
      .populate("yTRequirement", "requirement")
      .lean();

    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Send final success response
    return successResponse(res, 200, "Successfully", classes);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const classTimesForUser = async (req, res) => {
  try {
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Filter query
    const query = await filterQueryOfClassForUser(req.query);
    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YogaTutorClass.find(query)
        .select(
          "_id modeOfClass classType startDate endDate price time description timeDurationInMin approvalByAdmin datesOfClasses instructorTimeZone createdAt"
        )
        .sort({ startDate: -1, endDate: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .lean(),
      YogaTutorClass.countDocuments(query),
    ]);
    const totalPages = totalClasses[0]?.total
      ? Math.ceil(totalClasses[0].total / resultPerPage)
      : 0;
    const transformData = await Promise.all(
      classes.map(async (times) => {
        const classStartTimeInUTC = await convertGivenTimeZoneToUTC(
          `${times.startDate.toISOString().split("T")[0]}T${times.time}:00.000`,
          times.instructorTimeZone
        );
        const datesOfClasses = [];
        for (let i = 0; i < times.datesOfClasses.length; i++) {
          const classDatesTimeInUTC = await convertGivenTimeZoneToUTC(
            `${times.datesOfClasses[i].date.toISOString().split("T")[0]}T${
              times.time
            }:00.000`,
            times.instructorTimeZone
          );
          const day = await getDatesDay(
            classDatesTimeInUTC.replace(" ", "T") + ".000Z"
          );
          datesOfClasses.push({
            date: times.datesOfClasses[i].date,
            classDatesTimeInUTC,
            day,
            meetingLink: times.datesOfClasses[i].meetingLink,
          });
        }
        return {
          ...times,
          classStartTimeInUTC,
          datesOfClasses,
        };
      })
    );
    // Send final success response
    return successResponse(res, 200, "Successfully", {
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export {
  addNewClassTimes,
  classTimesForInstructor,
  updateYTClassTimes,
  classTimesForAdmin,
  approvalClassTimes,
  classTimesDetailsForInstructor,
  classTimesForUser,
  deleteYTClassTimes,
};

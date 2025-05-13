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
  convertUTCToGivenTimeZone,
  getDatesDay,
} from "../../../../Util/timeZone.js";
import { ServiceOrder } from "../../../../Model/User/Services/serviceOrderModel.js";
import { createGoogleMeet } from "../../../../Util/googleMeet.js";
import {
  FUTURE_CLASS_CREATION,
  MEET_CAN_JOIN_BEFORE,
  PER_CLASS_PRICE_LIMIT,
} from "../../../../Config/class.const.js";
import { YTClassDate } from "../../../../Model/User/Services/YogaTutorClass/yTClassDatesModel.js";
const { OTP_DIGITS_LENGTH } = process.env;

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
    cT, // classType,
    search,
    date = new Date().toISOString().split("T")[0], // Default today
    timing,
    yc, // yogaCategory,
    pt, // packageType
    miP = parseInt(PER_CLASS_PRICE_LIMIT), // minimumPrice,
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
  if (pt) query.packageType = pt;
  if (date) query.startDate = { $gte: new Date(date) };
  if (timing) query.time = timing;
  if (cT) query.classType = cT;
  if (Array.isArray(yc) && yc.length > 1) {
    query.yogaCategory = { $in: yc };
  }
  // Price
  query.$expr = {
    $and: [
      { $gte: [{ $divide: ["$price", "$numberOfClass"] }, parseInt(miP)] },
      { $lte: [{ $divide: ["$price", "$numberOfClass"] }, parseInt(maP)] },
    ],
  };
  return query;
}

async function canUserJoin(times) {
  const now = new Date().getTime();

  for (const classDate of times.datesOfClasses) {
    const classStartUTC = classDate.startDateTimeUTC;
    const joinWindowStart = new Date(
      classStartUTC.getTime() - parseInt(MEET_CAN_JOIN_BEFORE) * 60000
    ); // 5 mins before
    const joinWindowEnd = new Date(
      classStartUTC.getTime() + times.timeDurationInMin * 60000
    ); // end of class

    if (now >= joinWindowStart.getTime() && now <= joinWindowEnd.getTime()) {
      return {
        canJoin: true,
        classDate,
        joinWindowEnd,
        joinWindowStart,
      };
    }
  }

  return { canJoin: false };
}

async function extractLearner(order) {
  const learnerMap = {};
  for (const item of order) {
    const id = item.learner._id;

    if (!learnerMap[id]) {
      learnerMap[id] = {
        _id: id,
        name: item.learner.name,
        profilePic: item.learner.profilePic
          ? item.learner.profilePic.url || null
          : null,
        numberOfBooking: 0,
      };
    }

    learnerMap[id].numberOfBooking += item.numberOfBooking;
  }
  const result = Object.values(learnerMap);
  return result;
}

async function checkUserProfile(userId) {
  const result = [];
  const user = await User.findById(userId)
    .select(
      "profilePic education language gender experience_year bio isAadharVerified"
    )
    .lean();
  if (!user.profilePic || !user.profilePic.url) result.push("profilePic");
  if (user.education.length < 1) result.push("education");
  if (user.language.length < 1) result.push("language");
  if (!user.gender) result.push("gender");
  if (!user.experience_year) result.push("experience_year");
  if (!user.bio) result.push("bio");
  if (!user.isAadharVerified) result.push("isAadharVerified");
  return result;
}

async function transformBookedData(classes) {
  const transformData = await Promise.all(
    classes.map(async (times) => {
      const classStartTimeInUTC = await convertGivenTimeZoneToUTC(
        `${times.startDate.toISOString().split("T")[0]}T${times.time}:00.000`,
        times.instructorTimeZone
      );
      const datesOfClasses = [];
      for (let i = 0; i < times.datesOfClasses.length; i++) {
        const day = await getDatesDay(times.datesOfClasses[i].startDateTimeUTC);
        datesOfClasses.push({ ...times.datesOfClasses[i], day });
      }
      // Data
      const data = { ...times, classStartTimeInUTC, datesOfClasses };
      if (!times.instructor) {
        const learner = await extractLearner(times.serviceOrder);
        data.learner = learner;
        delete data.serviceOrder;
      } else {
        data.instructor = {
          ...times.instructor,
          profilePic: times.instructor.profilePic
            ? times.instructor.profilePic.url || null
            : null,
        };
      }
      return data;
    })
  );
  return transformData;
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
    if (Math.ceil(price / numberOfClass) < parseInt(PER_CLASS_PRICE_LIMIT))
      return failureResponse(
        res,
        400,
        "Price for individual person per day should be greater then 500.",
        null
      );
    if (numberOfClass !== datesOfClasses.length)
      return failureResponse(res, 400, "Select all dates!", null);
    // date
    for (let i = 0; i < datesOfClasses.length; i++) {
      const classDatesTimeInUTC = await convertGivenTimeZoneToUTC(
        `${datesOfClasses[i]}T${time}:00.000`,
        req.user.userTimeZone
      );
      const hasPastDate =
        new Date(`${classDatesTimeInUTC.replace(" ", "T")}.000Z`).getTime() >=
        new Date().getTime() + parseInt(FUTURE_CLASS_CREATION) * 60 * 60 * 1000;
      if (!hasPastDate)
        return failureResponse(
          res,
          400,
          "All date should be 24 hours in future.",
          null
        );
    }
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
      .select("time startDate endDate timeDurationInMin")
      .populate("datesOfClasses", "date")
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
    const overLapMessage = "Slot already taken!";
    if (checkOverLap) return failureResponse(res, 400, overLapMessage);
    // Create Yoga class
    const ytcClass = await YogaTutorClass.create({
      instructorTimeZone: req.user.userTimeZone,
      modeOfClass,
      classType,
      time,
      yogaCategory: yogaCategory?.length > 0 ? yogaCategory : [],
      yTRequirement: yTRequirement?.length > 0 ? yTRequirement : [],
      yTRule: yTRule?.length > 0 ? yTRule : [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      numberOfSeats,
      numberOfClass,
      packageType,
      price,
      description,
      timeDurationInMin,
      instructor: req.user._id,
    });
    // Insert dates
    const dateObject = await Promise.all(
      datesOfClasses.map(async (dates) => {
        const classDatesTimeInUTC = await convertGivenTimeZoneToUTC(
          `${dates}T${time}:00.000`,
          req.user.userTimeZone
        );
        const startDateTimeUTC = new Date(
          `${classDatesTimeInUTC.replace(" ", "T")}.000Z`
        );
        const endDateTimeUTC = new Date(
          new Date(`${classDatesTimeInUTC.replace(" ", "T")}.000Z`).getTime() +
            parseInt(timeDurationInMin) * 60 * 1000
        );
        const password = await generateFixedLengthRandomNumber(
          OTP_DIGITS_LENGTH
        );
        return {
          date: new Date(dates),
          meetingLink: null,
          password,
          startDateTimeUTC,
          endDateTimeUTC,
          instructor: req.user._id,
          yogaTutorClass: ytcClass._id,
        };
      })
    );
    const datesOf = await YTClassDate.insertMany(dateObject, { ordered: true });
    const classTimesId = datesOf.map((time) => time._id);
    // Update
    await YogaTutorClass.updateOne(
      { _id: ytcClass._id },
      { $set: { datesOfClasses: classTimesId } }
    );
    const message = "Class created successfully.";
    const requiredProfileDetails = await checkUserProfile(req.user._id);
    // Send final success response
    return successResponse(res, 201, message, { requiredProfileDetails });
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
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
    failureResponse(res);
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
        "You cannot update a booked class.",
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
    return successResponse(res, 201, "Slot updated!");
  } catch (err) {
    failureResponse(res);
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
        "You cannot delete a booked class.",
        null
      );
    // Update Class to soft delete
    await classes.updateOne({
      $set: { isDelete: true, deleted_at: new Date() },
    });
    // Send final success response
    return successResponse(res, 200, "Deleted Successfully!");
  } catch (err) {
    failureResponse(res);
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
    failureResponse(res);
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
    failureResponse(res);
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
        "_id modeOfClass classType startDate endDate time description price timeDurationInMin numberOfSeats numberOfClass packageType approvalByAdmin createdAt"
      )
      .populate("yogaCategory", "yogaCategory description")
      .populate("datesOfClasses", "_id date startDateTimeUTC classStatus")
      .populate("yTRule", "rule")
      .populate("yTRequirement", "requirement")
      .lean();

    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Send final success response
    return successResponse(res, 200, "Successfully", classes);
  } catch (err) {
    failureResponse(res);
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
          "_id modeOfClass classType startDate endDate price time description timeDurationInMin approvalByAdmin instructorTimeZone totalBookedSeat numberOfSeats isBooked createdAt"
        )
        .sort({ startDate: -1, endDate: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("instructor", "name profilePic")
        .populate(
          "datesOfClasses",
          "_id date startDateTimeUTC endDateTimeUTC classStatus"
        )
        .populate("yogaCategory", "-_id yogaCategory description")
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
          const day = await getDatesDay(
            times.datesOfClasses[i].startDateTimeUTC
          );
          datesOfClasses.push({ ...times.datesOfClasses[i], day });
        }
        return {
          ...times,
          classStartTimeInUTC,
          datesOfClasses,
          instructor: {
            _id: times.instructor._id,
            name: times.instructor.name,
            profilePic: times.instructor.profilePic.url,
          },
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
    failureResponse(res);
  }
};

const joinMeeting = async (req, res) => {
  try {
    const _id = req.user._id;
    const dateId = req.body.dateId;
    if (!dateId) return failureResponse(res, 400, "Date id required!");
    const ytcId = req.params.id;
    let ytc;
    if (req.user.role === "learner") {
      // Check is order present
      const isOrder = await ServiceOrder.findOne({
        learner: _id,
        serviceId: ytcId,
        status: "completed",
      })
        .select("_id numberOfBooking")
        .lean();
      if (!isOrder) {
        return failureResponse(res, 400, "Purchase this order...");
      }
      // Is this class presnt
      ytc = await YogaTutorClass.findOne({
        _id: ytcId,
        isDelete: false,
      }).lean();
      if (!ytc) return failureResponse(res, 500, "Something went wrong.");
    } else if (req.user.role === "instructor") {
      // Is this class presnt
      ytc = await YogaTutorClass.findOne({
        _id: ytcId,
        instructor: _id,
        isDelete: false,
      }).lean();
      if (!ytc) return failureResponse(res, 400, "This class is not present.");
    } else {
      return failureResponse(res);
    }
    // Is this class booked
    if (!ytc.isBooked)
      return failureResponse(res, 400, "This yoga class is not booked.");
    // Find dateOfClass
    const datesOfClass = await YTClassDate.findOne({
      _id: dateId,
      yogaTutorClass: ytcId,
    }).lean();
    if (!datesOfClass)
      return failureResponse(res, 400, "This yoga class date is not present.");
    // is this class time within 5 min of stating time
    const min5 = await canUserJoin({
      time: ytc.time,
      timeDurationInMin: ytc.timeDurationInMin,
      instructorTimeZone: ytc.instructorTimeZone,
      datesOfClasses: [{ ...datesOfClass }],
    });
    if (!min5.canJoin) {
      return failureResponse(
        res,
        400,
        "You can only join before 5 min of class starting time."
      );
    } else {
      const newClassDate = min5.classDate;
      let generateMeet = newClassDate.meetingLink;
      if (!generateMeet) {
        generateMeet = await createGoogleMeet(
          min5.joinWindowStart,
          min5.joinWindowEnd
        );
      }
      const existingJoiner =
        newClassDate.joinedBy.map((us) => us.toString()) || [];
      const joinedBy = [
        ...new Set([...existingJoiner, req.user._id.toString()]),
      ];
      // Update YTC
      await YTClassDate.updateOne(
        { _id: dateId },
        { $set: { joinedBy, meetingLink: generateMeet } }
      );
      // Send final success response
      return successResponse(res, 200, "Successfully", { data: generateMeet });
    }
  } catch (err) {
    failureResponse(res);
  }
};

const classTimesBookedForInstructor = async (req, res) => {
  try {
    const { classStatus = "upcoming", days } = req.query;
    const daysInt = parseInt(days) || 30;

    let today = new Date();
    if (classStatus === "upcoming") {
      today = new Date(
        new Date().getTime() - parseInt(MEET_CAN_JOIN_BEFORE) * 60 * 1000
      );
    } else {
      today.setUTCHours(0, 0, 0, 0);
    }

    const future = new Date(today.getTime() + daysInt * 24 * 60 * 60 * 1000);
    future.setUTCHours(23, 59, 59, 999);

    // Query
    const query = {
      instructor: req.user._id,
      startDateTimeUTC: { $gte: today, $lte: future },
      classStatus,
    };
    // Get required data
    const classes = await YTClassDate.find(query)
      .select("_id date startDateTimeUTC endDateTimeUTC classStatus")
      .sort({ startDate: 1 })
      .populate({
        path: "yogaTutorClass",
        model: "YogaTutorClass",
        select:
          "_id modeOfClass classType startDate endDate time timeDurationInMin isBooked packageType instructorTimeZone createdAt",
        populate: {
          path: "serviceOrder",
          model: "ServiceOrder",
          select: "_id numberOfBooking",
          populate: {
            path: "learner",
            model: "User",
            select: "name profilePic",
          },
        },
      })
      .lean();
    // Change
    const trans = classes.map(({ yogaTutorClass, ...rest }) => {
      return { ...yogaTutorClass, datesOfClasses: [{ ...rest }] };
    });
    // Transfrom
    const transformData = await transformBookedData(trans);
    // Send final success response
    return successResponse(res, 200, "Successfully", { data: transformData });
  } catch (err) {
    failureResponse(res);
  }
};

const myClassTimesForUser = async (req, res) => {
  try {
    // Find order
    const isOrder = await ServiceOrder.find({
      learner: req.user._id,
      service: "yogatutorclass",
      status: "completed",
    })
      .select("_id serviceId numberOfBooking")
      .lean();

    const ytcId = [];
    for (let i = 0; i < isOrder.length; i++) {
      ytcId.push(isOrder[i].serviceId);
    }

    const { classStatus = "upcoming", days } = req.query;
    const daysInt = parseInt(days) || 30;

    let today = new Date();
    if (classStatus === "upcoming") {
      today = new Date(
        new Date().getTime() - parseInt(MEET_CAN_JOIN_BEFORE) * 60 * 1000
      );
    } else {
      today.setUTCHours(0, 0, 0, 0);
    }

    const future = new Date(today.getTime() + daysInt * 24 * 60 * 60 * 1000);
    future.setUTCHours(23, 59, 59, 999);

    // Query
    const query = {
      yogaTutorClass: ytcId,
      startDateTimeUTC: { $gte: today, $lte: future },
      classStatus,
    };
    // Get required data
    const classes = await YTClassDate.find(query)
      .select("_id date startDateTimeUTC endDateTimeUTC classStatus")
      .sort({ startDate: 1 })
      .populate({
        path: "yogaTutorClass",
        model: "YogaTutorClass",
        select:
          "_id modeOfClass classType startDate packageType endDate serviceOrder time timeDurationInMin isBooked instructorTimeZone",
        populate: {
          path: "serviceOrder",
          model: "ServiceOrder",
          select: "_id numberOfBooking",
        },
      })
      .populate("instructor", "name profilePic")
      .lean();
    // Change
    const trans = classes.map(({ yogaTutorClass, instructor, ...rest }) => {
      return { ...yogaTutorClass, instructor, datesOfClasses: [{ ...rest }] };
    });
    // Transfrom
    const transformData = await transformBookedData(trans);
    // Send final success response
    return successResponse(res, 200, "Successfully", { data: transformData });
  } catch (err) {
    failureResponse(res);
  }
};

const bookedClassTimesDetails = async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      isDelete: false,
      isBooked: true,
    };
    // Get required data
    const classes = await YogaTutorClass.findOne(query)
      .select(
        "_id modeOfClass classType startDate endDate time description price timeDurationInMin instructorTimeZone password numberOfSeats numberOfClass packageType approvalByAdmin isBooked"
      )
      .populate("yogaCategory", "yogaCategory description")
      .populate(
        "datesOfClasses",
        "_id date startDateTimeUTC endDateTimeUTC classStatus password joinedBy"
      )
      .populate("yTRule", "rule")
      .populate("yTRequirement", "requirement")
      .populate({
        path: "serviceOrder",
        select: "_id receipt",
        populate: {
          path: "learner",
          model: "User",
          select: "name profilePic",
        },
      })
      .populate("instructor", "name profilePic averageRating bio")
      .lean();

    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);

    // Modify data
    if (req.user.role === "instructor") {
      classes.learner = classes.serviceOrder.map(({ learner }) => {
        return {
          ...learner,
          profilePic: learner.profilePic
            ? learner.profilePic.url || null
            : null,
        };
      });
    }
    classes.serviceOrder = classes.serviceOrder.map((ord) => {
      return { _id: ord._id, receipt: ord.receipt };
    });
    classes.instructor = {
      ...classes.instructor,
      profilePic: classes.instructor.profilePic
        ? classes.instructor.profilePic.url || null
        : null,
    };
    const datesOfClasses = [];
    for (let i = 0; i < classes.datesOfClasses.length; i++) {
      const day = await getDatesDay(classes.datesOfClasses[i].startDateTimeUTC);
      if (req.user.role === "instructor")
        delete classes.datesOfClasses[i].password;
      datesOfClasses.push({
        ...classes.datesOfClasses[i],
        day,
        joinedBy: classes.datesOfClasses[i].joinedBy.length,
      });
    }
    classes.datesOfClasses = datesOfClasses;
    // Send final success response
    return successResponse(res, 200, "Successfully", classes);
  } catch (err) {
    failureResponse(res);
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
  joinMeeting,
  classTimesBookedForInstructor,
  myClassTimesForUser,
  bookedClassTimesDetails,
};

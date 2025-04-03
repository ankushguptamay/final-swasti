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
import { convertGivenTimeZoneToUTC } from "../../../../Util/timeZone.js";

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
    miP = 100, // minimumPrice,
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
      { className: containInString },
      { classType: containInString },
      { modeOfClass: containInString },
      { description: containInString },
    ];
  }
  // Filter
  if (mOC) query.modeOfClass = mOC;
  if (date)
    query.$or = [
      { unPublishDate: { $exists: false } },
      { unPublishDate: { $gte: new Date(date) } },
    ];
  if (timing) query.time = timing;
  query.classType = cT;
  const divide = "$yogaTutorPackage.numberOfDays";
  let type = "$yogaTutorPackage.individual_price";
  if (cT === "group") {
    type = "$yogaTutorPackage.group_price";
  }
  const priceQuery = {
    $expr: {
      $and: [
        { $gte: [{ $divide: [type, divide] }, miP] },
        { $lte: [{ $divide: [type, divide] }, maP] },
      ],
    },
  };
  return { query, priceQuery };
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
    // Is over lapping present
    const checkOverLap = await isOverlapping(existingOnGoingTimes, newTime);
    const overLapMessage =
      "This time slot overlaps with an existing time slot. Please view existing time slots!";
    if (checkOverLap) return failureResponse(res, 400, overLapMessage);
    // Password
    const password = generateFixedLengthRandomNumber(
      process.env.OTP_DIGITS_LENGTH
    );
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
      datesOfClasses: datesOfClasses.map((date) => new Date(date)),
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
      className,
      yogaTutorPackage,
      yogaCategory,
      description,
      yTRequirement,
      yTRule,
    } = req.body;
    const _id = req.params.id;
    // Find record
    const classes = await YogaTutorClass.findOne({
      _id,
      instructor: req.user._id,
      isDelete: false,
    }).select(
      "approvalByAdmin anyApprovalRequest className yogaCategory description yogaTutorPackage yTRequirement yTRule"
    );
    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Get Changed field
    if (classes._doc.approvalByAdmin === "accepted") {
      const forHistory = {};
      const forDirectUpdate = {};
      let anyApprovalRequest = false,
        approvalByAdmin = "accepted";
      // Class Name
      if (className !== classes._doc.className) {
        anyApprovalRequest = true;
        approvalByAdmin = "pending";
        forHistory.className = className;
      }
      // Description
      if (description !== classes._doc.description) {
        anyApprovalRequest = true;
        approvalByAdmin = "pending";
        forHistory.description = description;
      }
      // Yoga Tutor Package
      if (
        yogaTutorPackage.toString() != classes._doc.yogaTutorPackage.toString()
      ) {
        forHistory.yogaTutorPackage = yogaTutorPackage;
        forDirectUpdate.yogaTutorPackage = yogaTutorPackage;
      }
      //  Yoga Tutor
      if (yogaCategory && yogaCategory.length >= 1) {
        const existing = classes._doc.yogaCategory.map((eve) => eve.toString());
        const isEqual = await compareArrays(
          yogaCategory.sort(),
          existing.sort()
        );
        if (!isEqual) {
          forHistory.yogaCategory = yogaCategory;
          forDirectUpdate.yogaCategory = yogaCategory;
        }
      }
      // Requirement
      if (yTRequirement && yTRequirement.length >= 1) {
        const existing = classes._doc.yTRequirement
          ? classes._doc.yTRequirement.map((eve) => eve.toString())
          : [];
        const isEqual = await compareArrays(
          yTRequirement.sort(),
          existing.sort()
        );
        if (!isEqual) forDirectUpdate.yTRequirement = yTRequirement;
      }
      // Rule
      if (yTRule && yTRule.length >= 1) {
        const existing = classes._doc.yTRule
          ? classes._doc.yTRule.map((eve) => eve.toString())
          : [];
        const isEqual = await compareArrays(yTRule.sort(), existing.sort());
        if (!isEqual) forDirectUpdate.yTRule = yTRule;
      }
      // Update
      await classes.updateOne({
        $set: { ...forDirectUpdate, anyApprovalRequest },
      });
      // Update any if pending
      await YTClassUpdateHistory.updateMany(
        { yogaTutorClass: _id, approvalByAdmin: "Pending" },
        { $set: { approvalByAdmin: "rejected" } }
      );
      // Create new history
      if (Object.entries(forHistory).length !== 0) {
        await YTClassUpdateHistory.create({
          ...forHistory,
          approvalByAdmin,
          yogaTutorClass: _id,
        });
      }
    } else if (classes._doc.approvalByAdmin === "rejected") {
      await classes.updateOne({
        $set: { ...req.body, approvalByAdmin: "pending" },
      });
    } else {
      await classes.updateOne({ $set: { ...req.body } });
    }
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
      approvalByAdmin = "pending"
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
          "_id modeOfClass classType startDate time timeDurationInMin description approvalByAdmin instructorTimeZone yTRequirement yTRule createdAt"
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
    }).select(
      "approvalByAdmin className yogaCategory description yogaTutorPackage"
    );
    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Save History
    if (approvalByAdmin === "accepted") {
      await YTClassUpdateHistory.create({
        approvalByAdmin,
        className: classes.className,
        yogaCategory: classes.yogaCategory,
        description: classes.description,
        yogaTutorPackage: classes.yogaTutorPackage,
        yogaTutorClass: _id,
      });
    }
    // Save
    await classes.updateOne({
      $set: { approvalByAdmin, anyApprovalRequest: false },
    });
    // Send final success response
    return successResponse(res, 201, `Class ${approvalByAdmin} successfully`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const classTimesUpdationRequest = async (req, res) => {
  try {
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Query
    const query = { approvalByAdmin: "pending" };

    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YTClassUpdateHistory.find(query)
        .select(
          "_id className description yogaTutorPackage yogaCategory approvalByAdmin createdAt"
        )
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate(
          "yogaTutorClass",
          "_id modeOfClass classType className publishedDate time timeDurationInMin description approvalByAdmin instructorTimeZone createdAt"
        )
        .lean(),
      YTClassUpdateHistory.countDocuments(query),
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

const approvalClassTimesUpdate = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateApprovalClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const approvalByAdmin = req.body.approvalByAdmin;
    const _id = req.params.id;
    // Find record
    const classes = await YTClassUpdateHistory.findOne({ _id }).select(
      "approvalByAdmin className description yogaTutorClass"
    );
    if (!classes)
      return failureResponse(
        res,
        400,
        "This class updation request is not present!",
        null
      );
    const data = { anyApprovalRequest: false };
    // Save History
    if (approvalByAdmin === "accepted") {
      if (classes._doc.className) {
        data.className = classes._doc.className;
      }
      if (classes._doc.description) {
        data.description = classes._doc.description;
      }
    }
    // Update
    await YogaTutorClass.updateOne(
      { _id: classes._doc.yogaTutorClass },
      { $set: { data } }
    );
    // Save
    await classes.updateOne({ $set: { approvalByAdmin } });
    // Send final success response
    return successResponse(
      res,
      201,
      `Request ${approvalByAdmin} successfully.`
    );
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
        "_id modeOfClass classType className publishedDate unPublishDate time description timeDurationInMin approvalByAdmin createdAt"
      )
      .populate(
        "yogaTutorPackage",
        "packageType packageName group_price individual_price numberOfDays"
      )
      .populate("yogaCategory", "yogaCategory description")
      .populate("yTRule", "rule")
      .populate("yTRequirement", "requirement");

    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Send final success response
    return successResponse(res, 200, "Successfully", {
      ...classes._doc,
      unPublishDate: classes._doc.unPublishDate || null,
    });
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
    const { query, priceQuery } = await filterQueryOfClassForUser(req.query);
    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YogaTutorClass.aggregate([
        {
          $lookup: {
            from: "yogatutorpackages",
            localField: "yogaTutorPackage",
            foreignField: "_id",
            as: "yogaTutorPackage",
          },
        },
        { $unwind: "$yogaTutorPackage" }, // Flatten array
        { $match: query },
        { $match: priceQuery },
        {
          $project: {
            _id: 1,
            modeOfClass: 1,
            classType: 1,
            className: 1,
            publishedDate: 1,
            unPublishDate: 1,
            time: 1,
            timeDurationInMin: 1,
            approvalByAdmin: 1,
            instructorTimeZone: 1,
            createdAt: 1,
            "yogaTutorPackage.packageType": 1,
            "yogaTutorPackage.packageName": 1,
            "yogaTutorPackage.group_price": 1,
            "yogaTutorPackage.individual_price": 1,
            "yogaTutorPackage.numberOfDays": 1,
          },
        },
        { $sort: { publishedDate: -1, unPublishDate: -1 } },
        { $skip: skip },
        { $limit: resultPerPage },
      ]),
      YogaTutorClass.aggregate([
        {
          $lookup: {
            from: "yogatutorpackages",
            localField: "yogaTutorPackage",
            foreignField: "_id",
            as: "yogaTutorPackage",
          },
        },
        { $unwind: "$yogaTutorPackage" },
        { $match: query },
        { $match: priceQuery },
        { $count: "total" }, // Correct count method
      ]),
    ]);
    const totalPages = totalClasses[0]?.total
      ? Math.ceil(totalClasses[0].total / resultPerPage)
      : 0;
    const transformData = classes.map((times) => {
      const classPublishTimeInUTC = convertGivenTimeZoneToUTC(
        `${times.publishedDate}T${times.time}:00.000`,
        times.instructorTimeZone
      );
      return {
        ...times,
        unPublishDate: times.unPublishDate || null,
        classPublishTimeInUTC,
      };
    });
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
  approvalClassTimesUpdate,
  classTimesUpdationRequest,
  classTimesDetailsForInstructor,
  classTimesForUser,
};

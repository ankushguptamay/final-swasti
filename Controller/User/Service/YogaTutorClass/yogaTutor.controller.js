import { getOldValues } from "../../../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../../../MiddleWare/responseMiddleware.js";
import {
  validateUpdateYTClassTimes,
  validateYTClassTimes,
  validateApprovalClassTimes,
} from "../../../../MiddleWare/Validation/slots.js";
import { YTClassUpdateHistory } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorClassHistoryModel.js";
import { YogaTutorClass } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import moment from "moment-timezone";

// Helper
function isTimeSlotOverlapping(existingRecords, newRecord) {
  return existingRecords.some((record) => {
    // Convert dates to timestamps for proper comparison
    const recordStartDate = new Date(record.publishedDate).getTime();
    const recordEndDate = record.unPublishDate
      ? new Date(record.unPublishDate).getTime()
      : Infinity;
    const newDate = new Date(newRecord.publishedDate).getTime();
    // Check if the new record's date falls within the existing record's date range
    if (recordStartDate <= newDate && newDate <= recordEndDate) {
      // Convert time to minutes for easy comparison
      const existingStart = getMinutes(record.time);
      const existingEnd = existingStart + record.timeDurationInMin;
      const newStart = getMinutes(newRecord.time);
      const newEnd = newStart + newRecord.timeDurationInMin;

      // Check if times overlap
      return !(newEnd <= existingStart || newStart >= existingEnd);
    }
    return false;
  });
}

function getMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// This Function convet UTC time in preticular time zone
function convertUTCToGivenTimeZone(utcTime, timeZone) {
  return moment.utc(utcTime).tz(timeZone).format("YYYY-MM-DD HH:mm:ss");
}

function convertGivenTimeZoneToUTC(dateTime, timeZone) {
  return moment.tz(dateTime, timeZone).utc().format("YYYY-MM-DD HH:mm:ss");
}

const allTimeZone = moment.tz.names();

// Main Controller
const addNewClassTimes = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { modeOfClass, classType, times } = req.body;
    // Over lap times array
    const overlappingTimes = [];
    for (let i = 0; i < times.length; i++) {
      // Find all ongoing times
      const existingOnGoingTimes = await YogaTutorClass.find({
        instructor: req.user._id,
        isDelete: false,
        $or: [
          { unPublishDate: { $exists: false } },
          { unPublishDate: { $gte: new Date(times[i].publishedDate) } },
        ],
      }).select("time publishedDate unPublishDate timeDurationInMin");
      const newTime = {
        time: times[i].time,
        timeDurationInMin: times[i].timeDurationInMin,
        publishedDate: times[i].publishedDate,
      };
      // Is over lapping present
      const checkOverLap = isTimeSlotOverlapping(existingOnGoingTimes, newTime);
      if (!checkOverLap) {
        await YogaTutorClass.create({
          userTimeZone: req.user.userTimeZone,
          modeOfClass,
          classType,
          time: times[i].time,
          yogaCategory: times[i].yogaCategory,
          className: times[i].className,
          description: times[i].description,
          timeDurationInMin: times[i].timeDurationInMin,
          publishedDate: times[i].publishedDate,
          yogaTutorPackage: times[i].packageId,
          instructor: req.user._id,
        });
      } else {
        overlappingTimes.push(newTime);
      }
    }
    let message = "All time slots have been created without overlaps.";
    if (overlappingTimes.length >= 1) {
      message = `${
        times.length - overlappingTimes.length
      } time slots were added, and ${
        overlappingTimes.length
      } overlapping slots were removed.`;
    }
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
      query.$or = {
        className: containInString,
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
          "_id modeOfClass classType className publishedDate unPublishDate time timeDurationInMin approvalByAdmin createdAt"
        )
        .sort({ publishedDate: -1, unPublishDate: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate(
          "yogaTutorPackage",
          "packageType packageName group_price individual_price numberOfDays"
        )
        .lean(),
      YogaTutorClass.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalClasses / resultPerPage) || 0;
    const transformData = classes.map((times) => {
      return { ...times, unPublishDate: times.unPublishDate || null };
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

const updateYTClassTimes = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUpdateYTClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    // Body
    const { className, packageId, yogaCategory, description } = req.body;
    const _id = req.params.id;
    // Find record
    const classes = await YogaTutorClass.findOne({
      _id,
      instructor: req.user._id,
      isDelete: false,
    }).select(
      "approvalByAdmin anyApprovalRequest className yogaCategory description yogaTutorPackage"
    );
    if (!classes)
      return failureResponse(res, 400, "This class is not present!", null);
    // Get Changed field
    if (classes._doc.approvalByAdmin === "accepted") {
      const forHistory = {};
      const forDirectUpdate = {};
      let anyApprovalRequest = false,
        approvalByAdmin = "accepted";
      if (className !== classes._doc.className) {
        anyApprovalRequest = true;
        approvalByAdmin = "pending";
        forHistory.className = className;
      }
      if (description !== classes._doc.description) {
        anyApprovalRequest = true;
        approvalByAdmin = "pending";
        forHistory.description = description;
      }
      if (packageId.toString() != classes._doc.yogaTutorPackage.toString()) {
        forHistory.yogaTutorPackage = yogaTutorPackage;
        forDirectUpdate.yogaTutorPackage = yogaTutorPackage;
      }
      if (yogaCategory && yogaCategory.length >= 1) {
        const existing = classes._doc.yogaCategory.map((eve) => eve.toString());
        const isEqual =
          yogaCategory.length === existing &&
          yogaCategory
            .sort()
            .every((val, index) => val === existing.sort()[index]);
        if (!isEqual) {
          forHistory.yogaCategory = yogaCategory;
          forDirectUpdate.yogaCategory = yogaCategory;
        }
      }
      await classes.updateOne({
        $set: { ...forDirectUpdate, anyApprovalRequest },
      });
      // Update any if pending
      await YTClassUpdateHistory.updateMany(
        { yogaTutorClass: _id, approvalByAdmin: "Pending" },
        { $set: { approvalByAdmin: "rejected" } }
      );
      // Create new history
      await YTClassUpdateHistory.create({
        ...forHistory,
        approvalByAdmin,
        yogaTutorClass: _id,
      });
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
      approvalByAdmin = "pending",
      anyApprovalRequest,
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
        className: containInString,
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
    if (
      anyApprovalRequest &&
      (anyApprovalRequest === "true" || anyApprovalRequest === "false")
    ) {
      query.anyApprovalRequest = JSON.parse(anyApprovalRequest);
    }
    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YogaTutorClass.find(query)
        .select(
          "_id modeOfClass classType className publishedDate time timeDurationInMin description approvalByAdmin userTimeZone createdAt anyApprovalRequest"
        )
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("yogaTutorPackage", "group_price individual_price")
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
          "_id className description packageId yogaCategory approvalByAdmin createdAt"
        )
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate(
          "yogaTutorClass",
          "_id modeOfClass classType className publishedDate time timeDurationInMin description approvalByAdmin userTimeZone createdAt"
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
    return successResponse(res, 201, `Request ${approvalByAdmin} successfully`);
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
};

import {
  failureResponse,
  successResponse,
} from "../../../../MiddleWare/responseMiddleware.js";
import { validateAppointmentTimes } from "../../../../MiddleWare/Validation/slots.js";
import { YogaTutorClass } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorModel.js";
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
const addNewAppointmentTimes = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAppointmentTimes(req.body);
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
    let message = "All time slot created with zero overlapping.";
    if (overlappingTimes.length >= 1) {
      message = "Time slot created without some overlapping slots.";
    }
    // Send final success response
    return successResponse(res, 201, message);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const appointmentTimesForInstructor = async (req, res) => {
  try {
    const { modeOfClass, classType, search, isApprovedByAdmin } = req.query;
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
    if (isApprovedByAdmin === "true" || isApprovedByAdmin === "false") {
      query.isApprovedByAdmin = JSON.parse(isApprovedByAdmin);
    }
    // Get required data
    const [classes, totalClasses] = await Promise.all([
      YogaTutorClass.find(query)
        .select(
          "_id modeOfClass classType className publishedDate unPublishDate time timeDurationInMin isApprovedByAdmin createdAt"
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
      console.log(times);
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

// className
// package
// yogaCategory
// description

export { addNewAppointmentTimes, appointmentTimesForInstructor };

import {
  failureResponse,
  successResponse,
} from "../../../../MiddleWare/responseMiddleware.js";
import { validateAppointmentTimes } from "../../../../MiddleWare/Validation/slots.js";
import { YogaTutorClass } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorModel.js";

// Helper
function isTimeSlotOverlapping(existingRecords, newRecord) {
  return existingRecords.some((record) => {
    // Convert dates to timestamps for proper comparison
    const recordStartDate = new Date(record.publishDate).getTime();
    const recordEndDate = record.unPublishDate
      ? new Date(record.unPublishDate).getTime()
      : Infinity;
    const newDate = new Date(newRecord.publishDate).getTime();

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
          modeOfClass,
          classType,
          time: times[i].time,
          yogaCategory: times[i].yogaCategory,
          className: times[i].className,
          description: times[i].description,
          timeDurationInMin: times[i].timeDurationInMin,
          publishedDate: times[i].publishedDate,
          yogaTutorPackage: times[i].yogaTutorPackage,
          instructor: req.user._id,
        });
      } else {
        overlappingTimes.push(newTime);
      }
    }
    let message = "All time slot created with zero overlapping.";
    if (overlappingTimes.length > 1) {
      message = "Time slot created without some overlapping slots.";
    }
    // Send final success response
    return successResponse(res, 201, message);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export { addNewAppointmentTimes };

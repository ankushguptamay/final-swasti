import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateYCBatch,
  validateReAssignYCBatch,
  validateAssignYCBatchIntitute,
} from "../../MiddleWare/Validation/institute.js";
import { YCLesson } from "../../Model/Institute/yCLessonModel.js";
import { YogaCourse } from "../../Model/Institute/yCBatchMode.js";
import { CoursePayment } from "../../Model/Institute/coursePaymentModel.js";
import { MasterYogaCourse } from "../../Model/Master/yogaCousreModel.js";
import { YOGACOURSETIMES } from "../../Config/class.const.js";

const createYCBatch = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYCBatch(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { startDate, assigned_to } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const masterYC = await MasterYogaCourse.findOne({ title: name })
      .select("_id amount")
      .lean();
    if (!masterYC) {
      return failureResponse(
        res,
        400,
        `This course is not present in Swasti's Yoga Course!`
      );
    }
    if (new Date().getTime() > new Date(startDate).getTime()) {
      return failureResponse(res, 400, `Please select a start date in future!`);
    }
    const isAnyCourse = await YogaCourse.findOne({
      name,
      startDate: new Date(startDate),
      totalEnroll: { $lte: 30 },
    })
      .select("_id")
      .lean();
    if (isAnyCourse) {
      return failureResponse(
        res,
        400,
        `A ${name} already runing on this time frame!`,
        null
      );
    }
    // End Date
    const endDate = new Date(startDate);
    const courseTime = YOGACOURSETIMES.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (!courseTime)
      return failureResponse(
        res,
        400,
        `Currently this course is not provide by Swasti!`
      );
    endDate.setDate(endDate.getDate() + courseTime.expireDay);
    await YogaCourse.create({
      name,
      startDate: new Date(startDate),
      endDate,
      masterYC: masterYC._id,
      amount: masterYC.amount,
      assigned_to,
    });
    // Send final success response
    return successResponse(res, 201, "Created successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const batchDetails = async (req, res) => {
  try {
    const [course, lesson, user] = await Promise.all([
      YogaCourse.findById(req.params.id)
        .populate("assigned_to", "name email mobileNumber")
        .populate("assigned_to_institute", "name email mobileNumber")
        .lean(),
      YCLesson.find({ yogaCourse: req.params.id })
        .select(
          "name video video_id date hls_url videoTimeInMinute thumbNailUrl document"
        )
        .lean(),
      CoursePayment.find({ yogaCourse: req.params.id, status: "completed" })
        .select("amount status")
        .populate("learner", "name email mobileNumber")
        .lean(),
    ]);
    course.startDateInIST = new Date(
      new Date(course.startDate).getTime() + 330 * 60 * 1000
    );
    for (let j = 0; j < lesson.length; j++) {
      lesson[j].dateInIST = new Date(
        new Date(lesson[j].date).getTime() + 330 * 60 * 1000
      );
    }
    // Send final success response
    return successResponse(res, 200, "Successfully!", {
      ...course,
      lesson,
      user,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const getCourseBatch = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    const query = {};
    if (search) {
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.name = withIn;
    }
    const [yogaCourse, totalYogaCourse] = await Promise.all([
      YogaCourse.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug startDate totalEnroll batchNumber createdAt")
        .populate("assigned_to", "name")
        .lean(),
      YogaCourse.countDocuments(query),
    ]);
    for (let i = 0; i < yogaCourse.length; i++) {
      yogaCourse[i].startDateInIST = new Date(
        new Date(yogaCourse[i].startDate).getTime() + 330 * 60 * 1000
      );
    }
    const totalPages = Math.ceil(totalYogaCourse / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: yogaCourse,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const reAssignYCBatchToInstructor = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateReAssignYCBatch(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { courseId, assigned_to } = req.body;
    const isAnyCourse = await YogaCourse.findById(courseId)
      .select("_id")
      .lean();
    if (!isAnyCourse) {
      return failureResponse(res, 400, `This course in not present`);
    }
    await YogaCourse.updateOne({ _id: courseId }, { $set: { assigned_to } });
    // Send final success response
    return successResponse(res, 201, "Successfully assigned!");
  } catch (err) {
    failureResponse(res);
  }
};

const myYCBatchesForIInstructor = async (req, res) => {
  try {
    const course = await YogaCourse.find({
      assigned_to: req.institute_instructor._id,
    })
      .select("name startDate slug totalEnroll endDate")
      .lean();
    for (let i = 0; i < course.length; i++) {
      course[i].startDateInIST = new Date(
        new Date(course[i].startDate).getTime() + 330 * 60 * 1000
      );
    }
    // Send final success response
    return successResponse(res, 200, "Successfully!", course);
  } catch (err) {
    failureResponse(res);
  }
};

const courseBatchDetailsForII = async (req, res) => {
  try {
    const course = await YogaCourse.findOne({ slug: req.params.slug })
      .select("_id name slug startDate totalEnroll batchNumber amount")
      .populate("assigned_to", "name email mobileNumber slug")
      .lean();
    const [lesson, user] = await Promise.all([
      YCLesson.find({ yogaCourse: course._id })
        .select(
          "name video date hls_url videoTimeInMinute thumbNailUrl document"
        )
        .lean(),
      CoursePayment.find({ yogaCourse: course._id, status: "completed" })
        .select("_id")
        .populate("learner", "name profilePic")
        .lean(),
    ]);
    course.startDateInIST = new Date(
      new Date(course.startDate).getTime() + 330 * 60 * 1000
    );
    for (let j = 0; j < lesson.length; j++) {
      lesson[j].dateInIST = new Date(
        new Date(lesson[j].date).getTime() + 330 * 60 * 1000
      );
    }
    const learner = [];
    for (let i = 0; i < user.length; i++) {
      learner.push({
        ...user[i].learner,
        profilePic: user[i].learner.profilePic
          ? user[i].learner.profilePic.url || null
          : null,
        paymentId: user[i]._id,
      });
    }
    if (req.institute_instructor) {
      delete course.assigned_to;
    }
    // Send final success response
    return successResponse(res, 200, "Successfully!", {
      ...course,
      lesson,
      learner,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const getYCBtachForDropDown = async (req, res) => {
  try {
    const yogaCourse = await YogaCourse.find({ endDate: { $gte: new Date() } })
      .sort({ createdAt: -1 })
      .select("_id name startDate batchNumber")
      .lean();
    for (let i = 0; i < yogaCourse.length; i++) {
      yogaCourse[i].startDateInIST = new Date(
        new Date(yogaCourse[i].startDate).getTime() + 330 * 60 * 1000
      );
    }
    return successResponse(res, 200, `Successfully!`, yogaCourse);
  } catch (err) {
    failureResponse(res);
  }
};

const deletebatch = async (req, res) => {
  try {
    const batchId = req.params.id;
    const [batch, payment] = await Promise.all([
      YogaCourse.findById(batchId).select("totalEnroll startDate").lean(),
      CoursePayment.find({ yogaCourse: batchId }).select("_id").lean(),
    ]);
    if (!batch) return failureResponse(res, 400, "This batch is not present!");
    if (batch.totalEnroll > 0)
      return failureResponse(
        res,
        400,
        `This batch have ${batch.totalEnroll} enrolled learner. First assign them to another batch!`
      );
    // Reassign payment to nearestbatch
    if (payment.length > 1) {
      const nearestBatch = await YogaCourse.aggregate([
        { $match: { startDate: { $ne: batch.startDate } } },
        {
          $addFields: {
            diff: { $abs: { $subtract: ["$startDate", batch.startDate] } },
          },
        },
        { $sort: { diff: 1 } },
        { $limit: 1 },
        { $project: { _id: 1, startDate: 1 } },
      ]);
      console.log(nearestBatch);
      for (let i = 0; i < payment.length; i++) {
        await CoursePayment.updateOne(
          { _id: payment[i]._id },
          {
            $set: {
              yogaCourse: nearestBatch._id,
              startDate: nearestBatch.startDate,
            },
          }
        );
      }
    }
    // Delete batch
    await YogaCourse.deleteOne({ _id: batchId });
    // Send final success response
    return successResponse(res, 200, "Batch deleted successfully!");
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const assignYCBatchToInstitute = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAssignYCBatchIntitute(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { courseId, assigned_to_institute } = req.body;
    const isAnyCourse = await YogaCourse.findById(courseId)
      .select("_id")
      .lean();
    if (!isAnyCourse) {
      return failureResponse(res, 400, `This course in not present`);
    }
    await YogaCourse.updateOne(
      { _id: courseId },
      { $set: { assigned_to_institute, assigned_to: null } }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully assigned!");
  } catch (err) {
    failureResponse(res);
  }
};

const myYCBatchesForInstitute = async (req, res) => {
  try {
    const course = await YogaCourse.find({
      assigned_to_institute: req.institute._id,
    })
      .select("name startDate slug totalEnroll endDate")
      .populate("assigned_to", "name email mobileNumber slug")
      .lean();
    for (let i = 0; i < course.length; i++) {
      course[i].startDateInIST = new Date(
        new Date(course[i].startDate).getTime() + 330 * 60 * 1000
      );
    }
    // Send final success response
    return successResponse(res, 200, "Successfully!", course);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  createYCBatch,
  batchDetails,
  getCourseBatch,
  reAssignYCBatchToInstructor,
  myYCBatchesForIInstructor,
  getYCBtachForDropDown,
  courseBatchDetailsForII,
  deletebatch,
  assignYCBatchToInstitute,
  myYCBatchesForInstitute,
};

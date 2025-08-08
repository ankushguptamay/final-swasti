import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateYCBatch,
  validateReAssignYCBatch,
} from "../../MiddleWare/Validation/institute.js";
import { YCLesson } from "../../Model/Institute/yCLessonModel.js";
import { YogaCourse } from "../../Model/Institute/yCBatchMode.js";
import { CoursePayment } from "../../Model/Institute/coursePaymentModel.js";
import { MasterYogaCourse } from "../../Model/Master/yogaCousreModel.js";

const createYCBatch = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYCBatch(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { startDate, amount, assigned_to } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const masterYC = await MasterYogaCourse.findOne({ title: name })
      .select("_id")
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
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 45);
    await YogaCourse.create({
      name,
      startDate: new Date(startDate),
      endDate,
      amount,
      masterYC: masterYC._id,
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
        .lean(),
      YCLesson.find({ yogaCourse: req.params.id })
        .select(
          "name video date hls_url videoTimeInMinute thumbNailUrl document"
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
      .select("name startDate endDate")
      .populate("assigned_to", "name email mobileNumber totalEnroll slug")
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

const courseBatchDetailsForInstructor = async (req, res) => {
  try {
    const [course, lesson, user] = await Promise.all([
      YogaCourse.findOne({ slug: req.params.slug })
        .select("_id name slug startDate totalEnroll batchNumber amount")
        .lean(),
      YCLesson.find({ yogaCourse: req.params.id })
        .select(
          "name video date hls_url videoTimeInMinute thumbNailUrl document"
        )
        .lean(),
      CoursePayment.find({ yogaCourse: req.params.id, status: "completed" })
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
      });
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

export {
  createYCBatch,
  batchDetails,
  getCourseBatch,
  reAssignYCBatchToInstructor,
  myYCBatchesForIInstructor,
  getYCBtachForDropDown,
  courseBatchDetailsForInstructor,
};

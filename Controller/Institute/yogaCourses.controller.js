import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYogaCourse,validateReAssignYogaCourse } from "../../MiddleWare/Validation/institute.js";
import { YogaCourse } from "../../Model/Institute/yogaCoursesMode.js";

const createYogaCourse = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourse(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { description, startDate, amount, assigned_to } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    if (new Date().getTime() > new Date(startDate).getTime()) {
      return failureResponse(res, 400, `Please select a start date in future!`);
    }
    const isAnyCourse = await YogaCourse.findOne({
      name,
      startDate: new Date(startDate),
      totalEnroll: { $lt: 30 },
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
      description,
      startDate: new Date(startDate),
      endDate: new Date(startDate),
      amount,
      assigned_to,
    });
    // Send final success response
    return successResponse(res, 201, "Created successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const courseDetailsForAdmin = async (req, res) => {
  try {
    const course = await YogaCourse.findById(req.params.id)
      .populate("assigned_to", "name email mobileNumber")
      .lean();
    // Send final success response
    return successResponse(res, 200, "Successfully!", course);
  } catch (err) {
    failureResponse(res);
  }
};

const getCourse = async (req, res) => {
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
        .select(
          "_id name slug startDate description totalEnroll batchNumber createdAt"
        )
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

const reAssignCourseToInstructor = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateReAssignYogaCourse(req.body);
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

export { createYogaCourse, courseDetailsForAdmin, getCourse, reAssignCourseToInstructor };

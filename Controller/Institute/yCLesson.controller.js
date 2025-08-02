import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateYogaCourseLesson,
  validateYogaCourseLessonUpdation,
} from "../../MiddleWare/Validation/institute.js";
import { YCLesson } from "../../Model/Institute/yCLessonModel.js";

const createYogaCourseLesson = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourseLesson(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const {
      date,
      video,
      yogaCourseId,
      hls_url,
      videoTimeInMinute,
      thumbNailUrl,
    } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    await YCLesson.create({
      name,
      video,
      date: new Date(date),
      yogaCourse: yogaCourseId,
      hls_url,
      videoTimeInMinute,
      thumbNailUrl,
    });
    // Send final success response
    return successResponse(res, 201, "Created successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const updateYogaCourseLesson = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourseLessonUpdation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { date, video, hls_url, videoTimeInMinute, thumbNailUrl } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const lesson = await YCLesson.findById(req.params.yCLessonId)
      .select("_id")
      .lean();
    if (!lesson)
      return failureResponse(res, 400, "This lesson is not present!");
    await YCLesson.updateOne(
      { _id: req.params.yCLessonId },
      {
        $set: {
          name,
          video,
          date: new Date(date),
          hls_url,
          videoTimeInMinute,
          thumbNailUrl,
        },
      }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully!", course);
  } catch (err) {
    failureResponse(res);
  }
};

export { createYogaCourseLesson, updateYogaCourseLesson };

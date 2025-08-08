import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYogaCourseReview } from "../../MiddleWare/Validation/institute.js";
import { CoursePayment } from "../../Model/Institute/coursePaymentModel.js";
import { YogaCourseReview } from "../../Model/Institute/yCReviewModel.js";
import { MasterYogaCourse } from "../../Model/Master/yogaCousreModel.js";
import mongoose from "mongoose";

// Helper Function
function calculateAverageRating(yogaCousreId) {
  return new Promise((resolve, reject) => {
    YogaCourseReview.aggregate([
      {
        $match: {
          masterYC: new mongoose.Types.ObjectId(yogaCousreId),
        },
      },
      { $group: { _id: "$masterYC", averageRating: { $avg: "$rating" } } },
      { $project: { _id: 0, averageRating: 1 } },
    ])
      .then((data) => {
        const averageRating =
          Array.isArray(data) && data.length > 0
            ? Math.round(data[0].averageRating * 10) / 10
            : 0;
        resolve(averageRating);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

const giveOrUpdateYCReviews = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourseReview(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { rating, message = null, masterYC_id } = req.body;
    const learner = req.user._id;
    // Find Course
    const course = await MasterYogaCourse.findById(masterYC_id)
      .select("title")
      .lean();
    if (!course)
      return failureResponse(res, 400, "This Yoga Course is not present!");
    // Check Is user taken this course
    const payment = await CoursePayment.findOne({
      courseName: course.title,
      learner,
      status: "completed",
      verify: true,
    }).lean();
    if (!payment)
      return failureResponse(
        res,
        400,
        "You are not able to give review to this Yoga Course!"
      );
    // Check is any review present
    await YogaCourseReview.findOneAndUpdate(
      { learner, masterYC: course._id },
      { updatedAt: new Date(), message, rating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Update Average rating of Instructor
    const averageRating = await calculateAverageRating(masterYC_id);
    await MasterYogaCourse.updateOne(
      { _id: masterYC_id },
      { $set: { averageRating } }
    );
    // Send final success response
    return successResponse(res, 201, `Review submitted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getYCReviews = async (req, res) => {
  try {
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Find Average rating and no of reviews
    const count = await YogaCourseReview.aggregate([
      { $match: { masterYC: new mongoose.Types.ObjectId(req.params.yCId) } },
      {
        $group: {
          _id: "$masterYC", // Group by instructor ID
          averageRating: { $avg: "$rating" }, // Calculate the average rating
          totalReviews: { $sum: 1 }, // Optional: Count total reviews
        },
      },
      { $project: { _id: 1, averageRating: 1, totalReviews: 1 } },
    ]);
    // Get data
    const [reviews, totalReview] = await Promise.all([
      YogaCourseReview.find({ masterYC: req.params.yCId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("rating message")
        .populate("learner", "_id name profilePic")
        .lean(),
      YogaCourseReview.countDocuments({ masterYC: req.params.yCId }),
    ]);
    // Transform review
    for (let i = 0; i < reviews.length; i++) {
      reviews[i].learner = {
        ...reviews[i].learner,
        profilePic: reviews[i].learner.profilePic
          ? reviews[i].learner.profilePic.url || null
          : null,
      };
    }
    // Send final success response
    return successResponse(res, 200, "Fetched!", {
      totalPages: Math.ceil(totalReview / resultPerPage) || 0,
      currentPage: page,
      count: count[0],
      reviews,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const deleteYCReviewByAdmin = async (req, res) => {
  try {
    // Check is any review present
    const review = await YogaCourseReview.findById(req.params.reviewId)
      .select("masterYC")
      .lean();
    if (!review)
      return failureResponse(res, 400, "This review is not present!");
    await YogaCourseReview.deleteOne({ _id: req.params.reviewId });
    // Update Average rating of Instructor
    const averageRating = await calculateAverageRating(review.masterYC);
    await MasterYogaCourse.updateOne(
      { _id: masterYC_id },
      { $set: { averageRating } }
    );
    // Send final success response
    return successResponse(res, 201, `Review deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export { giveOrUpdateYCReviews, getYCReviews, deleteYCReviewByAdmin };

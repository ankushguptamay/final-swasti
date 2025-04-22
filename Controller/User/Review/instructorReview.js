import mongoose from "mongoose";

import { User } from "../../../Model/User/Profile/userModel.js";
import { InstructorReview } from "../../../Model/User/Review/instructorReview.js";
import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import {
  validateDeleteMyReply,
  validateInstructorReview,
  validateReplyOnMyReviews,
} from "../../../MiddleWare/Validation/review.js";
import { ServiceOrder } from "../../../Model/User/Services/serviceOrderModel.js";

// Helper Function
function calculateAverageRating(instructor) {
  return new Promise((resolve, reject) => {
    InstructorReview.aggregate([
      {
        $match: {
          isDelete: false,
          instructor: new mongoose.Types.ObjectId(instructor),
        },
      },
      { $group: { _id: "$instructor", averageRating: { $avg: "$rating" } } },
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

function tranformReview(data) {
  const transformData = data.map(
    ({ _id, message, rating, learner, replies, reactions, createdAt }) => {
      return {
        _id,
        rating,
        message,
        learner: {
          _id: learner._id,
          name: learner.name,
          profilePic: learner.profilePic
            ? learner.profilePic.url || null
            : null,
        },
        createdAt,
        noOfReplies: replies.length,
        noOfReactions: reactions.length,
      };
    }
  );
  return transformData;
}

// Main Controller
const giveOrUpdateReviews = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstructorReview(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { rating, message = null, instructor } = req.body;
    const learner = req.user._id;
    // Match id
    if (learner.toString() == instructor.toString()) {
      return failureResponse(
        res,
        400,
        "You can not give review to your self!",
        null
      );
    }
    // Check Is user take any service from instructor or not
    const serviceOrder = await ServiceOrder.findOne({
      learner: req.user._id,
      status: "completed",
      verify: true,
    }).lean();
    if (!serviceOrder)
      return failureResponse(
        res,
        400,
        "You are not able to give review to this instructor!"
      );
    // Check is any review present
    const review = await InstructorReview.findOne({
      learner,
      instructor,
      isDelete: false,
    });
    // Update or create new one
    if (review) {
      review.message = message;
      review.rating = parseInt(rating);
      await review.save();
    } else {
      await InstructorReview.create({
        learner,
        instructor,
        message,
        rating: parseInt(rating),
      });
    }
    // Update Average rating of Instructor
    const averageRating = await calculateAverageRating(instructor);
    await User.updateOne({ _id: instructor }, { $set: { averageRating } });
    // Send final success response
    return successResponse(res, 201, `Review submitted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteReviewByUser = async (req, res) => {
  try {
    const learner = req.user._id;
    const review = await InstructorReview.findOne({
      _id: req.params.id,
      learner,
      isDelete: false,
    });
    if (!review)
      return failureResponse(res, 400, "This review is not present!", null);
    // Soft Delete
    review.isDelete = true;
    review.deleted_at = new Date();
    await review.save();
    // Update Average rating of Instructor
    const averageRating = await calculateAverageRating(review.instructor);
    await User.updateOne(
      { _id: review.instructor },
      { $set: { averageRating } }
    );
    // Send final success response
    return successResponse(res, 200, "Review deleted!");
  } catch (err) {
    failureResponse(res);
  }
};

const getReviews = async (req, res) => {
  try {
    let instructorId = req.query.id;
    if (req.user.role.toLowerCase() !== "instructor") {
      if (!instructorId) {
        return failureResponse(res, 400, "Please select a instructor!", null);
      }
    } else {
      instructorId = req.user._id;
    }
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Find Average rating and no of reviews
    const instructor = await InstructorReview.aggregate([
      {
        $match: {
          isDelete: false,
          instructor: new mongoose.Types.ObjectId(instructorId),
        },
      },
      {
        $group: {
          _id: "$instructor", // Group by instructor ID
          averageRating: { $avg: "$rating" }, // Calculate the average rating
          totalReviews: { $sum: 1 }, // Optional: Count total reviews
        },
      },
      { $project: { _id: 1, averageRating: 1, totalReviews: 1 } },
    ]);
    console.log(instructor);
    // Get data
    const query = { $and: [{ isDelete: false }, { instructor: instructorId }] };
    const [reviews, totalReview] = await Promise.all([
      InstructorReview.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("learner", "_id name profilePic")
        .lean(),
      InstructorReview.countDocuments(query),
    ]);
    // Transform review
    const transformData = tranformReview(reviews);
    // Send final success response
    return successResponse(res, 200, "Fetched!", {
      totalPages: Math.ceil(totalReview / resultPerPage) || 0,
      currentPage: page,
      instructor: instructor[0],
      reviews: transformData,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const giveUnGiveReactionOnReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const id = req.user._id;
    // Find Review
    const review = await InstructorReview.findOne({
      _id: reviewId,
      isDelete: false,
    });
    if (!review) {
      failureResponse(res, 400, "This review is not present", null);
    }

    if (
      review.instructor.toString() != id.toString() &&
      review.learner.toString() != id.toString()
    ) {
      // Check Is user take any service from instructor or not
    }
    let message = "Reaction gave!";
    let reactions = review.reactions.map((rea) => rea.toString());
    if (reactions.includes(id.toString())) {
      message = "Reaction taken back!";
      reactions = reactions.filter((e) => e !== id.toString());
    } else {
      reactions.push(id.toString());
    }
    review.reactions = reactions;

    await review.save();
    // Send final success response
    return successResponse(res, 200, message);
  } catch (err) {
    failureResponse(res);
  }
};

const replyOnMyReviews = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateReplyOnMyReviews(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { reviewId, reply } = req.body;
    const id = req.user._id;
    // Find Review
    const review = await InstructorReview.findOne({
      _id: reviewId,
      isDelete: false,
      $or: [{ learner: id }, { instructor: id }],
    });
    if (!review) {
      failureResponse(
        res,
        400,
        "Either this review is not present or you are not allow to reply on this review message!",
        null
      );
    }
    // New reply array
    const newReplies = [{ givenBy: id, reply, givenAt: new Date() }];
    for (const replyyyy of review.replies) {
      newReplies.push({
        _id: replyyyy._id,
        givenBy: replyyyy.givenBy,
        reply: replyyyy.reply,
        givenAt: replyyyy.givenAt,
      });
    }
    // save
    review.replies = newReplies;
    await review.save();
    // Send final success response
    return successResponse(res, 200, "Replied successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const deleteMyReply = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateDeleteMyReply(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { reviewId, replyId } = req.body;
    // Find Review
    const review = await InstructorReview.findOne({
      _id: reviewId,
      isDelete: false,
    });
    if (!review) {
      failureResponse(res, 400, "This review is not present!", null);
    }
    // New reply array
    const newReplies = [];
    for (const replyyyy of review.replies) {
      if (
        replyyyy.givenBy.toString() == req.user._id.toString() &&
        replyyyy._id.toString() == replyId.toString()
      ) {
      } else {
        newReplies.push({
          _id: replyyyy._id,
          givenBy: replyyyy.givenBy,
          reply: replyyyy.reply,
          givenAt: replyyyy.givenAt,
        });
      }
    } // save
    review.replies = newReplies;
    await review.save();
    // Send final success response
    return successResponse(res, 200, "Reply deleted successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const getReviewDetails = async (req, res) => {
  try {
    const reviewId = req.params.id;
    // Find Review
    const review = await InstructorReview.findOne({
      _id: reviewId,
      isDelete: false,
    })
      .select("_id rating message replies instructor reactions")
      .populate("learner", "_id name profilePic");
    if (!review) {
      failureResponse(res, 400, "This review is not present!", null);
    }
    // Find Average rating and no of reviews
    const instructor = await InstructorReview.aggregate([
      {
        $match: {
          isDelete: false,
          instructor: new mongoose.Types.ObjectId(review.instructor),
        },
      },
      {
        $group: {
          _id: "$instructor", // Group by instructor ID
          averageRating: { $avg: "$rating" }, // Calculate the average rating
          totalReviews: { $sum: 1 }, // Optional: Count total reviews
        },
      },
      { $project: { _id: 1, averageRating: 1, totalReviews: 1 } },
    ]);
    const transformData = {
      instructor: instructor[0],
      review: {
        ...review._doc,
        learner: {
          ...review.learner._doc,
          profilePic: review.learner.profilePic
            ? review.learner.profilePic.url || null
            : null,
        },
        reactions: review.reactions.length,
      },
    };
    // Send final success response
    return successResponse(res, 200, "Fetched successfully!", transformData);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  giveOrUpdateReviews,
  deleteReviewByUser,
  getReviews,
  giveUnGiveReactionOnReview,
  replyOnMyReviews,
  deleteMyReply,
  getReviewDetails,
};

import { User } from "../../../Model/User/Profile/userModel.js";
import { InstructorReview } from "../../../Model/User/Review/instructorReview.js";

async function averageRating(instructor) {
  try {
    const rating = await InstructorReview.aggregate([
      {
        $match: {
          isDelete: false,
          instructor: new mongoose.Types.ObjectId(instructor),
        },
      },
      { $group: { _id: "$instructor", averageRating: { $avg: "$rating" } } },
      { $project: { _id: 0, averageRating: 1 } },
    ]);
    // New Average rating
    const averageRating =
      Array.isArray(rating) && rating.length > 0
        ? Math.round(rating[0].averageRating * 10) / 10
        : 0;

    await User.updateOne({ _id: instructor }, { $set: { averageRating } });
  } catch (error) {
    console.log(error);
  }
}

const giveInstructorReviews = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstructorReview(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { rating, message, instructor } = req.body;
    const learner = req.user._id;

    // Check Is user take any service from instructor or not

    // Check is any review present
    const review = await AdvocateReview.findOne({
      client,
      advocate,
      isDelete: false,
    });

    if (review) {
      const newMessage = review.messages;
      if (message) {
        newMessage.push({ createdAt: new Date(), message, givenBy: client });
      }
      review.rating = rating;
      review.messages = newMessage;
      await review.save();
    } else {
      if (message) {
        await AdvocateReview.create({
          rating,
          messages: { message, givenBy: client, createdAt: new Date() },
          advocate,
          client,
        });
      } else {
        await AdvocateReview.create({
          rating,
          advocate,
          client,
        });
      }
    }

    // Update Average rating of advocate
    updateAverageRating(advocate);

    // Update Slot
    await Slot.updateMany(
      {
        advocate,
        client,
        $or: [
          { reviewGiven: { $exists: true, $eq: null } }, // Field exists and is null
          { reviewGiven: { $exists: false } }, // Field does not exist
        ],
      },
      { $set: { reviewGiven: true } } // Use $set to update the field
    );
    res.status(200).json({
      success: true,
      message: "Thanks to give review!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { UserChakras } from "../../Model/User/Profile/chakrasModel.js";
import { User } from "../../Model/User/Profile/userModel.js";

const searchUser = async (req, res) => {
  try {
    const {
      search,
      experienceLowerLimit,
      experienceUpperLimit,
      starRating,
      role = "instructor",
    } = req.query;

    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = { $and: [{ role }] };
    if (search) {
      const startWith = new RegExp("^" + search.toLowerCase(), "i");
      query.$and.push({ name: startWith });
    }

    // Filter
    if (role === "instructor") {
      if (experienceLowerLimit && experienceUpperLimit) {
        query.$and.push({
          experience_year: {
            $gte: parseInt(experienceLowerLimit),
            $lte: parseInt(experienceUpperLimit),
          },
        });
      }
      // Average rating
      if (starRating) {
        query.$and.push({
          averageRating: { $gte: parseInt(starRating) },
        });
      }
    }
    // Get required data
    const [user, totalUser] = await Promise.all([
      User.find(query)
        .select(
          "_id name role profilePic language dateOfBirth gender experience_year bio isProfileVisible averageRating"
        )
        .sort({ averageRating: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("specialization", "specialization")
        .lean(),
      User.countDocuments(query),
    ]);

    // Transform Data
    const transformData = user.map((user) => {
      const data = {
        _id: user._id,
        name: user.name,
        role: user.role,
        gender: user.gender,
        profilePic: user.profilePic ? user.profilePic.url || null : null,
      };
      if (user.role === "instructor") {
        data.bio = user.bio;
        data.language = user.language;
        data.specialization =
          user.specialization.length > 0
            ? user.specialization.map(({ specialization }) => specialization)
            : [];
        data.experience_year = user.experience_year;
        data.averageRating = user.averageRating;
      }
      return data;
    });
    const totalPages = Math.ceil(totalUser / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, `Successfully!`, {
      data: transformData,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const getUserReferral = async (req, res) => {
  try {
    const referralCode = req.params.rfC;
    const user = await User.findOne({ userCode: referralCode });
    if (!user)
      return failureResponse(res, 400, "This user is not present!", null);
    const [allUser, verifiedUser, chakras, totalUnredemedChakras] =
      await Promise.all([
        User.countDocuments({ referralCode }),
        User.countDocuments({
          referralCode,
          $or: [{ isEmailVerified: true }, { isMobileNumberVerified: true }],
        }),
        UserChakras.aggregate([
          {
            $match: {
              isRedeemed: false,
              referrer: new mongoose.Types.ObjectId(user._doc._id),
            },
          },
          {
            $group: {
              _id: "$chakraNumber",
              chakraName: { $first: "$chakraName" },
              totalChakras: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              chakraNumber: "$_id",
              _id: 0,
              chakraName: 1,
              totalChakras: 1,
            },
          },
        ]),
        UserChakras.countDocuments({
          isRedeemed: false,
          referrer: user._doc._id,
        }),
      ]);
    // Count completed set
    const completedSet =
      chakras.length === 7
        ? Math.min(...chakras.map(({ totalChakras }) => totalChakras))
        : 0;
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      allUserJoined: allUser,
      verifiedUser,
      unverifiedUser: parseInt(allUser) - parseInt(verifiedUser),
      totalUnredemedChakras,
      completedSet,
      chakras,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const usersReferral = async (req, res) => {
  try {
    const allUser = await UserChakras.aggregate([
      {
        $group: {
          _id: "$referrer",
          totalJoinedUser: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "referrerDetails",
        },
      },
      {
        $unwind: {
          path: "$referrerDetails",
          preserveNullAndEmptyArrays: true, // This ensures referrerDetails is not null or return value in string
        },
      },
      {
        $project: {
          referrer: {
            _id: "$referrerDetails._id",
            name: "$referrerDetails.name",
            profilePic: "$referrerDetails.profilePic",
          },
          totalJoinedUser: 1,
          _id: 0,
        },
      },
    ]);
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      allUser,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const userCount = async (req, res) => {
  try {
    const utcDate = new Date();
    utcDate.setMinutes(utcDate.getMinutes() - 1110);
    const today = new Date(
      `${utcDate.toISOString().split("T")[0]}T18:29:59.000Z`
    );
    const [allUser, verifiedUser, todayUser, todayVerifiedUser] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({
          $or: [{ isEmailVerified: true }, { isMobileNumberVerified: true }],
        }),
        User.countDocuments({
          createdAt: { $gte: today },
        }),
        User.countDocuments({
          $or: [{ isEmailVerified: true }, { isMobileNumberVerified: true }],
          createdAt: { $gte: today },
        }),
      ]);
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      allUser,
      verifiedUser,
      todayUser,
      todayVerifiedUser,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export { searchUser, getUserReferral, usersReferral, userCount };

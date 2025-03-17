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
    let query = {
      $and: [
        { _id: { $nin: [req.user._id] } },
        { role },
        // { isProfileVisible: true },
      ],
    };
    if (search) {
      const startWith = new RegExp("^" + search.toLowerCase(), "i");
      query.$and.push({ name: startWith });
    }

    // Filter
    if (role === "instructor") {
      if ((experienceLowerLimit, experienceUpperLimit)) {
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
    failureResponse(res, 500, err.message, null);
  }
};

const getUserReferral = async (req, res) => {
  try {
    const referralCode = req.params.rfC;
    const [allUser, verifiedUser] = await Promise.all([
      User.countDocuments({ referralCode }),
      User.countDocuments({
        referralCode,
        $or: [{ isEmailVerified: true }, { isMobileNumberVerified: true }],
      }),
    ]);
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      allUser,
      verifiedUser,
      unverifiedUser: parseInt(allUser) - parseInt(verifiedUser),
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export { searchUser, getUserReferral };

import { capitalizeFirstLetter } from "../../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import { validateSubscribedUser } from "../../../MiddleWare/Validation/userProfile.js";
import { SubscribedUser } from "../../../Model/User/Profile/subscribedUserModel.js";
import { User } from "../../../Model/User/Profile/userModel.js";

const createSubscribedUser = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSubscribedUser(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { email } = req.body;
    // Capital First Letter
    const name = req.body.name
      ? capitalizeFirstLetter(req.body.name)
      : undefined;
    // Find user
    const user = await User.findOne({ email }).lean();
    const data = { name, updatedAt: new Date() };
    if (user) data.user = user._id;
    // Store
    await SubscribedUser.findOneAndUpdate({ email }, data, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    // Send final success response
    return successResponse(res, 201, "Subscribed successfully.");
  } catch (err) {
    failureResponse(res);
  }
};

export { createSubscribedUser };

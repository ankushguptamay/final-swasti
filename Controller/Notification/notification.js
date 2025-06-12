import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { UserNotification } from "../../Model/User/notificationModel.js";

const myNotification = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // Search
    const query = { recipient: req.user._id, createdAt: { $gte: new Date() } };
    if (search) {
      const containInString = new RegExp(search, "i");
      query.$or = [
        { message: containInString },
        { title: containInString },
        { type: containInString },
        { redirectTo: containInString },
      ];
    }
    const [notification, totalNotification] = await Promise.all([
      UserNotification.find(query)
        .sort({ createdAt: -1 })
        .select("title message createdAt")
        .skip(skip)
        .limit(resultPerPage)
        .select("rule")
        .lean(),
      UserNotification.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalNotification / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, `Successfully.`, {
      notification,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const seenNotification = async (req, res) => {
  try {
    await UserNotification.updateMany(
      { recipient: req.user._id },
      { $set: { isSeen: true } }
    );
    // Send final success response
    return successResponse(res, 201, `Successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const readNotification = async (req, res) => {
  try {
    const _id = req.params.id;
    await UserNotification.updateOne(
      { _id, recipient: req.user._id },
      { $set: { isRead: true } }
    );
    // Send final success response
    return successResponse(res, 201, `Successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const notificationDetails = async (req, res) => {
  try {
    const _id = req.params.id;
    const notification = await UserNotification.findById({ _id }).select(
      "title message type createdAt redirectTo"
    );
    // Send final success response
    return successResponse(res, 200, `Successfully.`, { ...notification });
  } catch (err) {
    failureResponse(res);
  }
};

export {
  myNotification,
  notificationDetails,
  seenNotification,
  readNotification,
};

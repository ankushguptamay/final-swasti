import {
  failureResponse,
  successResponse,
} from "../../../../MiddleWare/responseMiddleware.js";
import { validateYTPackage } from "../../../../MiddleWare/Validation/slots.js";
import { YogaTutorClass } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorModel.js";
import { YogaTutorPackage } from "../../../../Model/User/Services/YogaTutorClass/yogaTutorPackageModel.js";
import { YogaTutorPackageHistory } from "../../../../Model/User/Services/YogaTutorClass/yTPackageHistoryModel.js";

// Helper
function getOldValues(obj1, obj2) {
  const oldValues = {};

  Object.keys(obj2).forEach((field) => {
    if (obj1[field] !== obj2[field]) {
      oldValues[field] = obj1[field]; // Store only the old value
    }
  });

  return oldValues;
}
// Main Controller
const addYTPackage = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTPackage(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { packageType, group_price, individual_price } = req.body;
    // Validate
    if (packageType === "individual") {
      if (!individual_price)
        return failureResponse(res, 400, "Individual price required!", null);
    } else if (packageType === "group") {
      if (!group_price)
        return failureResponse(res, 400, "Group price required!", null);
    } else {
      return failureResponse(
        res,
        400,
        "This package type is not supportable!",
        null
      );
    }
    // Store in database
    const packages = await YogaTutorPackage.create({
      ...req.body,
      instructor: req.user._id,
    });
    // Create History
    await YogaTutorPackageHistory.create({
      ...req.body,
      parentPackage: packages._id,
    });
    // Send final success response
    return successResponse(res, 201, `Package added successfully!`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const getYTPackage = async (req, res) => {
  try {
    const { packageType } = req.query;
    const query = { instructor: req.user._id, isDelete: false };
    if (packageType) {
      query.packageType = packageType;
    }
    const packages = await YogaTutorPackage.find(query).select(
      "packageType packageName individual_price group_price numberOfDays createdAt"
    );
    // Send final success response
    return successResponse(res, 200, `Package fetched successfully!`, {
      packages,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const yTPackageDetails = async (req, res) => {
  try {
    const packages = await YogaTutorPackage.findById(req.params.id).select(
      "packageType packageName individual_price group_price numberOfDays createdAt"
    );
    // Send final success response
    return successResponse(res, 200, `Package details fetched successfully!`, {
      packages,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const updateYTPackage = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTPackage(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { packageType, group_price, individual_price } = req.body;
    // Validate
    if (packageType === "individual") {
      if (!individual_price)
        return failureResponse(res, 400, "Individual price required!", null);
    } else if (packageType === "group") {
      if (!group_price)
        return failureResponse(res, 400, "Group price required!", null);
    } else {
      return failureResponse(
        res,
        400,
        "This package type is not supportable!",
        null
      );
    }
    // Find in database
    const packages = await YogaTutorPackage.findOne({
      _id: req.params.id,
      instructor: req.user._id,
      isDelete: false,
    });
    if (!packages)
      return failureResponse(res, 400, "This package is not present.", null);

    if (packages.packageType !== packageType)
      return failureResponse(
        res,
        400,
        "You can not change package type.",
        null
      );
    // Update
    await packages.updateOne({ $set: { ...req.body } });
    // Save history
    const result = getOldValues(packages._doc, req.body);
    await YogaTutorPackageHistory.create({
      ...result,
      parentPackage: packages._id,
    });
    // Send final success response
    return successResponse(res, 200, `Package details fetched successfully!`, {
      packages,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteYTPackage = async (req, res) => {
  try {
    // Find in database
    const packages = await YogaTutorPackage.findOne({
      _id: req.params.id,
      instructor: req.user._id,
      isDelete: false,
    });
    if (!packages)
      return failureResponse(res, 400, "This package is not present.", null);
    // Check is this package has any active ongoing appointment
    const existingOnGoingTimes = await YogaTutorClass.countDocuments({
      instructor: req.user._id,
      yogaTutorPackage: req.params.id,
      $or: [
        { unPublishDate: { $exists: false } },
        { unPublishDate: { $gte: new Date() } },
      ],
    });
    if (existingOnGoingTimes > 0)
      return failureResponse(
        res,
        400,
        "This package is attached with many onging appointment times.",
        null
      );
    // Soft delete
    packages.isDelete = true;
    packages.deleted_at = new Date();
    await packages.save();
    // Send final success response
    return successResponse(res, 200, `Package deleted successfully!`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export {
  addYTPackage,
  getYTPackage,
  yTPackageDetails,
  deleteYTPackage,
  updateYTPackage,
};

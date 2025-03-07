import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import { validateBankDetails } from "../../../MiddleWare/Validation/userProfile.js";
import { BankDetail } from "../../../Model/User/Profile/bankDetailsModel.js";
import { User } from "../../../Model/User/Profile/userModel.js";

// Main Controller
const addBankDetails = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateBankDetails(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { IFSCCode, accountNumber, bankName, branch } = req.body;
    // Find in RECORDS
    const isPresent = await BankDetail.findOne({
      IFSCCode,
      accountNumber,
      bankName,
      user: req.user._id,
      isDelete: false,
    });
    if (isPresent)
      return failureResponse(res, 400, `This bank detail already exist!`);
    // Create this bank details
    const details = await BankDetail.create({
      IFSCCode,
      accountNumber,
      bankName,
      branch,
      user: req.user._id,
    });
    // Update bankdetails array in user profile
    const user = await User.findById(req.user._id).select("bankDetail");
    user.bankDetail = [...user.bankDetail, details._id];
    await user.save();
    // Send final success response
    return successResponse(
      res,
      201,
      `Bank details have been added successfully.`
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const bankDetails = async (req, res) => {
  try {
    const details = await BankDetail.find({
      user: req.user._id,
      isDelete: false,
    })
      .select("_id IFSCCode accountNumber branch bankName")
      .sort({
        createdAt: -1,
      });
    // Send final success response
    return successResponse(res, 201, `Bank details fetched successfully!`, {
      details,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const bankDetailById = async (req, res) => {
  try {
    const details = await BankDetail.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    }).select("_id IFSCCode accountNumber bankName branch");
    // Send final success response
    return successResponse(res, 201, `Bank detail fetched successfully!`, {
      details,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteBankDetails = async (req, res) => {
  try {
    const details = await BankDetail.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    });
    if (!details)
      return failureResponse(res, 400, `This bank detail does not exist!`);
    // Update isDelete
    details.isDelete = true;
    details.deleted_at = new Date();
    details.save();
    // Update bankdetails array in user profile
    const user = await User.findById(req.user._id).select("bankDetail");
    const bankDetail = [];
    for (const bank of user._doc.bankDetail) {
      if (bank.toString() !== details._doc._id.toString()) {
        bankDetail.push(bank);
      }
    }
    user.bankDetail = bankDetail;
    await user.save();
    // Send final success response
    return successResponse(
      res,
      201,
      `Bank details have been deleted successfully.`
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export { addBankDetails, bankDetails, bankDetailById, deleteBankDetails };

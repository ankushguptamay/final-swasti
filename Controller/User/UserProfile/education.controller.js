import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import { validateEducation } from "../../../MiddleWare/Validation/userProfile.js";
import { Education } from "../../../Model/User/Profile/educationModel.js";
import { User } from "../../../Model/User/Profile/userModel.js";

// Main Controller
const addEducation = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateEducation(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { qualificationName, university_institute, yearOfCompletion } =
      req.body;
    // Find in RECORDS
    const isPresent = await Education.findOne({
      qualificationName,
      university_institute,
      user: req.user._id,
      isDelete: false,
    });
    if (isPresent)
      return failureResponse(res, 400, `This education already exist!`);
    // Create this education
    const education = await Education.create({
      qualificationName,
      university_institute,
      yearOfCompletion: new Date(yearOfCompletion),
      user: req.user._id,
    });
    // Update education array in user profile
    const user = await User.findById(req.user._id).select("education");
    user.education = [...user.education, education._id];
    await user.save();
    // Send final success response
    return successResponse(
      res,
      201,
      `Education details have been added successfully.`
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const educations = async (req, res) => {
  try {
    const education = await Education.find({
      user: req.user._id,
      isDelete: false,
    })
      .select("_id qualificationName university_institute yearOfCompletion")
      .sort({
        createdAt: -1,
      });
    // Send final success response
    return successResponse(res, 200, `Education fetched successfully!`, {
      education,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const educationById = async (req, res) => {
  try {
    const education = await Education.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    }).select("_id qualificationName university_institute yearOfCompletion");
    // Send final success response
    return successResponse(res, 200, `Education fetched successfully!`, {
      education,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const updateEducation = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateEducation(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { qualificationName, university_institute, yearOfCompletion } =
      req.body;
    // Find in RECORDS
    const isPresent = await Education.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    });
    if (!isPresent)
      return failureResponse(res, 400, `This education does not exist!`);
    // Find in RECORDS
    // const isNewPresent = await Education.findOne({
    //   qualificationName,
    //   university_institute,
    //   user: req.user._id,
    //   isDelete: false,
    // });
    // if (isNewPresent)
    //   return failureResponse(res, 400, `This education already exist!`);
    // Delete this education
    isPresent.isDelete = true;
    isPresent.deleted_at = new Date();
    isPresent.save();
    // Create new education
    const education = await Education.create({
      qualificationName,
      university_institute,
      yearOfCompletion: new Date(yearOfCompletion),
      createdAt: isPresent.createdAt,
      user: req.user._id,
    });
    // Update education array in user profile
    const user = await User.findById(req.user._id).select("education");
    // add in array
    user.education = [...user.education, education._id];
    // Remove from array
    const newEducationArray = [];
    for (const edu of user.education) {
      if (edu.toString() !== isPresent._doc._id.toString()) {
        newEducationArray.push(edu);
      }
    }
    // Save
    user.education = newEducationArray;
    await user.save();
    // Send final success response
    return successResponse(
      res,
      201,
      `Education details have been updated successfully.`
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteEducation = async (req, res) => {
  try {
    const educations = await Education.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    });
    if (!educations)
      return failureResponse(res, 400, `This education does not exist!`);
    // Update isDelete
    educations.isDelete = true;
    educations.deleted_at = new Date();
    educations.save();
    // Update education array in user profile
    const user = await User.findById(req.user._id).select("education");
    const education = [];
    for (const edu of user._doc.education) {
      if (edu.toString() !== educations._doc._id.toString()) {
        education.push(edu);
      }
    }
    user.education = education;
    await user.save();
    // Send final success response
    return successResponse(
      res,
      200,
      `Education details have been deleted successfully.`
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export {
  addEducation,
  educations,
  educationById,
  deleteEducation,
  updateEducation,
};

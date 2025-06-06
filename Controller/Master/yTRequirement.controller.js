import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYTRequirement } from "../../MiddleWare/Validation/master.js";
import { YogaTutorRequirement } from "../../Model/Master/YogaTutorRequirementModel.js";
import { YogaTutorClass } from "../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";

// Main Controller
const addYTRequirement = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTRequirement(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { requirement } = req.body;
    // Store in database
    await YogaTutorRequirement.create({ requirement });
    // Send final success response
    return successResponse(res, 201, `Requirement added successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const getYTRequirement = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Search
    const query = {};
    if (search) {
      const containInString = new RegExp(search, "i");
      query.requirement = containInString;
    }
    const [requirement, totalRequirement] = await Promise.all([
      YogaTutorRequirement.find(query)
        .sort({ requirement: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("requirement")
        .lean(),
      YogaTutorRequirement.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRequirement / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, `Requirements fetched successfully.`, {
      requirement,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const updateYTRequirement = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTRequirement(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { requirement } = req.body;
    // Find in database
    const requirements = await YogaTutorRequirement.findById(req.params.id);
    if (!requirements)
      return failureResponse(
        res,
        400,
        "This yoga tutor requirement is not present.",
        null
      );
    // Update
    requirements.requirement = requirement;
    await requirements.save();
    // Send final success response
    return successResponse(res, 201, `Requirement updated successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteYTRequirement = async (req, res) => {
  try {
    // Find in database
    const requirements = await YogaTutorRequirement.findById(req.params.id);
    if (!requirements)
      return failureResponse(
        res,
        400,
        "This yoga tutor requirement is not present.",
        null
      );
    // Delete from all place
    await YogaTutorClass.updateMany(
      { yTRequirement: requirements._id },
      { $pull: { yTRequirement: requirements._id } }
    );
    // Delete
    await requirements.deleteOne();
    // Send final success response
    return successResponse(res, 200, `Requirement deleted successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addYTRequirement,
  getYTRequirement,
  updateYTRequirement,
  deleteYTRequirement,
};

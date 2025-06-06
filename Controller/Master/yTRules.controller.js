import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYTRule } from "../../MiddleWare/Validation/master.js";
import { YogaTutorRule } from "../../Model/Master/yogaTutorRulesModel.js";
import { YogaTutorClass } from "../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";

// Main Controller
const addYTRule = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTRule(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { rule } = req.body;
    // Store in database
    await YogaTutorRule.create({ rule });
    // Send final success response
    return successResponse(res, 201, `Rule added successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const getYTRule = async (req, res) => {
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
      query.rule = containInString;
    }
    const [rule, totalRule] = await Promise.all([
      YogaTutorRule.find(query)
        .sort({ rule: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("rule")
        .lean(),
      YogaTutorRule.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRule / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, `Rules fetched successfully.`, {
      rule,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const updateYTRule = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYTRule(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { rule } = req.body;
    // Find in database
    const rules = await YogaTutorRule.findById(req.params.id);
    if (!rules)
      return failureResponse(
        res,
        400,
        "This yoga tutor rule is not present.",
        null
      );
    // Update
    rules.rule = rule;
    await rules.save();
    // Send final success response
    return successResponse(res, 201, `Rule updated successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteYTRule = async (req, res) => {
  try {
    // Find in database
    const rules = await YogaTutorRule.findById(req.params.id);
    if (!rules)
      return failureResponse(
        res,
        400,
        "This yoga tutor rule is not present.",
        null
      );
    // Delete from all place
    await YogaTutorClass.updateMany(
      { yTRule: rules._id },
      { $pull: { yTRule: rules._id } }
    );
    // Delete
    await rules.deleteOne();
    // Send final success response
    return successResponse(res, 200, `Rule deleted successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

export { addYTRule, getYTRule, updateYTRule, deleteYTRule };

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
    failureResponse(res, 500, err.message, null);
  }
};

const getYTRule = async (req, res) => {
  try {
    const rule = await YogaTutorRule.find().select("rule");
    // Send final success response
    return successResponse(res, 200, `Rules fetched successfully.`, { rule });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
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
    failureResponse(res, 500, err.message, null);
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
    failureResponse(res, 500, err.message, null);
  }
};

export { addYTRule, getYTRule, updateYTRule, deleteYTRule };

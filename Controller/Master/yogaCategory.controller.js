import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYogaCategory } from "../../MiddleWare/Validation/master.js";
import { YogaCategory } from "../../Model/Master/yogaCategoryModel.js";

const addYogaCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const yogaCategory = capitalizeFirstLetter(
      req.body.yogaCategory.replace(/\s+/g, " ").trim()
    );
    await YogaCategory.findOneAndUpdate(
      { yogaCategory },
      { updatedAt: new Date(), description: req.body.description },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const getYogaCategory = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = {};
    if (req.query.search) {
      const startWith = new RegExp("^" + req.query.search.toLowerCase(), "i");
      query = { yogaCategory: startWith };
    }
    const [yogaCategory, totalYogaCategory] = await Promise.all([
      YogaCategory.find(query)
        .sort({ yogaCategory: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("yogaCategory description")
        .lean(),
      YogaCategory.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalYogaCategory / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: yogaCategory,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const yogaCategoryDetails = async (req, res) => {
  try {
    const yogaCategory = await YogaCategory.findOne({ _id: req.params.id });
    if (!yogaCategory) {
      return failureResponse(
        res,
        400,
        `This YogaCategory is not present!`,
        null
      );
    }
    return successResponse(res, 200, `Successfully!`, { yogaCategory });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const updateYogaCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const yogaCategory = capitalizeFirstLetter(
      req.body.yogaCategory.replace(/\s+/g, " ").trim()
    );
    const yogaCategories = await YogaCategory.findOne({
      _id: req.params.id,
    });
    if (!yogaCategories) {
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    if (yogaCategory !== yogaCategories.yogaCategory) {
      const isPresnt = await YogaCategory.findOne({ yogaCategory });
      if (isPresnt) {
        return failureResponse(
          res,
          400,
          "This yoga category already present!",
          null
        );
      }
    }
    await yogaCategories.updateOne({
      yogaCategory,
      description: req.body.description || undefined,
    });
    return successResponse(res, 201, `Updated successfully!`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteYogaCategory = async (req, res) => {
  try {
    const yogaCategory = await YogaCategory.findOne({ _id: req.params.id });
    if (!yogaCategory) {
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    // delete
    await yogaCategory.deleteOne();
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export {
  addYogaCategory,
  getYogaCategory,
  yogaCategoryDetails,
  updateYogaCategory,
  deleteYogaCategory,
};

import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateSpecialization } from "../../MiddleWare/Validation/master.js";
import { Specialization } from "../../Model/Master/specializationModel.js";
import { User } from "../../Model/User/Profile/userModel.js";

const addSpecialization = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSpecialization(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const specialization = capitalizeFirstLetter(
      req.body.specialization.replace(/\s+/g, " ").trim()
    );
    await Specialization.findOneAndUpdate(
      { specialization },
      { updatedAt: new Date(), description: req.body.description },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getSpecialization = async (req, res) => {
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
      query = { specialization: startWith };
    }
    const [specialization, totalSpecialization] = await Promise.all([
      Specialization.find(query)
        .sort({ specialization: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("specialization")
        .lean(),
      Specialization.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalSpecialization / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      specialization,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const specializationDetails = async (req, res) => {
  try {
    const specialization = await Specialization.findOne({
      _id: req.params.id,
    }).select("_id specialization description");
    if (!specialization) {
      return failureResponse(
        res,
        400,
        `This Specialization is not present!`,
        null
      );
    }
    return successResponse(res, 200, `Successfully!`, { specialization });
  } catch (err) {
    failureResponse(res);
  }
};

const updateSpecialization = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateSpecialization(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { description = undefined } = req.body;
    const specialization = capitalizeFirstLetter(
      req.body.specialization.replace(/\s+/g, " ").trim()
    );
    const specializations = await Specialization.findOne({
      _id: req.params.id,
    });
    if (!specializations) {
      return failureResponse(
        res,
        400,
        `This Specialization is not present!`,
        null
      );
    }
    if (specialization !== specializations.specialization) {
      const isPresnt = await Specialization.findOne({ specialization });
      if (isPresnt) {
        return failureResponse(
          res,
          400,
          "This specialization already present!",
          null
        );
      }
    }
    await specializations.updateOne({ specialization, description });
    return successResponse(res, 201, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteSpecialization = async (req, res) => {
  try {
    const specialization = await Specialization.findOne({ _id: req.params.id });
    if (!specialization) {
      return failureResponse(
        res,
        400,
        `This Specialization is not present!`,
        null
      );
    }
    // Delete from all place
    await User.updateMany(
      { specialization: specialization._id },
      { $pull: { specialization: specialization._id } }
    );
    // delete
    await specialization.deleteOne();
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addSpecialization,
  getSpecialization,
  specializationDetails,
  updateSpecialization,
  deleteSpecialization,
};

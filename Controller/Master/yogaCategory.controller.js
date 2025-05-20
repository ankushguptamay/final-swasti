import dotenv from "dotenv";
dotenv.config();

import {
  compressImageFile,
  deleteSingleFile,
} from "../../Helper/fileHelper.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateYogaCategory } from "../../MiddleWare/Validation/master.js";
import { YogaCategory } from "../../Model/Master/yogaCategoryModel.js";
import { YogaTutorClass } from "../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_FOLDER;
import fs from "fs";

const addYogaCategory = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      // Delete file from server
      deleteSingleFile(req.file.path);
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const yogaCategory = req.body.yogaCategory;
    // Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    // Delete file from server
    deleteSingleFile(req.file.path);
    const image = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    // Find in data
    const category = await YogaCategory.findOne({ yogaCategory }).lean();
    if (category && category.image && category.image.fileName) {
      deleteFileToBunny(bunnyFolderName, category.image.fileName);
    }
    // Create or update
    await YogaCategory.findOneAndUpdate(
      { yogaCategory },
      { updatedAt: new Date(), description: req.body.description, image },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
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
        .sort({ yogaCategory: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id yogaCategory description")
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
    failureResponse(res);
  }
};

const yogaCategoryDetails = async (req, res) => {
  try {
    const yogaCategory = await YogaCategory.findById(req.params.id)
      .select("yogaCategory description image")
      .lean();
    if (!yogaCategory) {
      return failureResponse(
        res,
        400,
        `This YogaCategory is not present!`,
        null
      );
    }
    yogaCategory.image = yogaCategory.image
      ? yogaCategory.image.url || null
      : null;
    return successResponse(res, 200, `Successfully!`, { yogaCategory });
  } catch (err) {
    failureResponse(res);
  }
};

const getYogaCategoryWithImage = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = {};
    if (req.query.search) {
      const containInString = new RegExp(req.query.search, "i");
      query = { yogaCategory: containInString };
    }
    const [yogaCategory, totalYogaCategory] = await Promise.all([
      YogaCategory.find(query)
        .sort({ yogaCategory: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id yogaCategory description image")
        .lean(),
      YogaCategory.countDocuments(query),
    ]);
    for (let i = 0; i < yogaCategory.length; i++) {
      const id = yogaCategory[i]._id;
      const queryForYogaTutor = {
        yogaCategory: { $in: [id] },
        classStartTimeInUTC: {
          $gte: new Date(new Date().toISOString().split("T")[0]),
        },
        isDelete: false,
      };
      const numberOfClass = await YogaTutorClass.countDocuments(
        queryForYogaTutor
      );
      yogaCategory[i].numberOfClass = numberOfClass;
      yogaCategory[i].image = yogaCategory[i].image
        ? yogaCategory[i].image.url || null
        : null;
    }
    const totalPages = Math.ceil(totalYogaCategory / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: yogaCategory,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const updateYogaCategoryImage = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    const id = req.params.id;
    const yogaCategories = await YogaCategory.findById(id).lean();
    if (!yogaCategories) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    // Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    // Delete file from server
    deleteSingleFile(req.file.path);
    const image = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    // Delete file from bunny if exist
    if (yogaCategories.image && yogaCategories.image.fileName) {
      deleteFileToBunny(bunnyFolderName, yogaCategories.image.fileName);
    }
    // Update record
    await YogaCategory.updateOne({ _id: id }, { $set: { image } });
    return successResponse(res, 201, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
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
    // Delete from all place
    await YogaTutorClass.updateMany(
      { yogaCategory: yogaCategory._id },
      { $pull: { yogaCategory: yogaCategory._id } }
    );
    // Delete image
    if (yogaCategory.image && yogaCategory.image.url) {
      deleteFileToBunny(bunnyFolderName, category.image.url);
    }
    // delete
    await yogaCategory.deleteOne();
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addYogaCategory,
  getYogaCategory,
  yogaCategoryDetails,
  updateYogaCategoryImage,
  deleteYogaCategory,
  getYogaCategoryWithImage,
};

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
import { getEmbedding } from "../../Util/AIFunction.js";
import cosineSimilarity from "cosine-similarity";

const addYogaCategory = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const yogaCategory = req.body.yogaCategory;
    // Find in data
    const category = await YogaCategory.findOne({ yogaCategory }).lean();
    if (category) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, "Category already exist!");
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
    // Get Embedding
    const embedding = await getEmbedding(yogaCategory);
    // Create or update
    await YogaCategory.create({
      yogaCategory,
      description: req.body.description,
      tags: req.body.tags,
      image,
      embedding,
    });
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getYogaCategory = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    const query = {};
    if (search) {
      const startWith = new RegExp("^" + search.toLowerCase(), "i");
      query.yogaCategory = startWith;
    }
    const [yogaCategory, totalYogaCategory] = await Promise.all([
      YogaCategory.find(query)
        .sort({ yogaCategory: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id yogaCategory")
        .lean(),
      YogaCategory.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalYogaCategory / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: yogaCategory,
      totalPages,
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
    let query,
      yogaCategory,
      data = {},
      totalYogaCategory = {};
    if (req.query.search) {
      const userEmbedding = await getEmbedding(req.query.search);
      const allCategory = await YogaCategory.find()
        .select("_id yogaCategory image embedding")
        .lean();
      const scoredCategories = allCategory.map((cat) => ({
        ...cat,
        similarity: cosineSimilarity(userEmbedding, cat.embedding),
      }));
      scoredCategories.sort((a, b) => b.similarity - a.similarity); // Descending order
      yogaCategory = scoredCategories.slice(0, 5); // Top 5 categories
    } else {
      [yogaCategory, totalYogaCategory] = await Promise.all([
        YogaCategory.find()
          .sort({ yogaCategory: 1 })
          .skip(skip)
          .limit(resultPerPage)
          .select("_id yogaCategory image")
          .lean(),
        YogaCategory.countDocuments(query),
      ]);
      const totalPages = Math.ceil(totalYogaCategory / resultPerPage) || 0;
      data.totalPages = totalPages;
      data.currentPage = page;
    }
    // Optimized Parallel Counting for numberOfClass
    await Promise.all(
      yogaCategory.map(async (cat) => {
        const queryForYogaTutor = {
          yogaCategory: { $in: [cat._id] },
          classStartTimeInUTC: {
            $gte: new Date(new Date().toISOString().split("T")[0]),
          },
          isDelete: false,
        };
        const numberOfClass = await YogaTutorClass.countDocuments(
          queryForYogaTutor
        );

        cat.numberOfClass = numberOfClass;
        cat.image = cat.image ? cat.image.url || null : null;
        delete cat.similarity; // Only present if search was done
        delete cat.embedding;
      })
    );
    data.data = yogaCategory;
    return successResponse(res, 200, `Successfully!`, data);
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
    if (yogaCategory.image && yogaCategory.image.fileName) {
      deleteFileToBunny(bunnyFolderName, yogaCategory.image.fileName);
    }
    // delete
    await YogaCategory.deleteOne({ _id: req.params.id });
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

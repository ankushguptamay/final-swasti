import dotenv from "dotenv";
dotenv.config();

import { deleteSingleFile } from "../../Helper/fileHelper.js";
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
import { compareArrays } from "../../Helper/formatChange.js";

async function removeSomeWord(input) {
  const wordsToRemove = ["yoga", "for", "from", "to"];
  const regex = new RegExp(`\\b(${wordsToRemove.join("|")})\\b`, "gi");
  const cleaned = input
    .replace(regex, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned;
}

async function finalQuery(input) {
  const cleanSearch = await removeSomeWord(input);
  const arr = cleanSearch.split(" ");
  const regexConditions = arr.map((term) => ({
    $or: [
      { yogaCategory: new RegExp(term, "i") },
      { description: new RegExp(term, "i") },
      { tags: new RegExp(term, "i") },
    ],
  }));
  const finalQuery = { $or: regexConditions.map((c) => c.$or).flat() };
  return finalQuery;
}

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
    const category = await YogaCategory.findOne({
      yogaCategory: { $regex: new RegExp(`^${yogaCategory.trim()}$`, "i") },
    }).lean();
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
    const filterCategory = await removeSomeWord(yogaCategory);
    const combinedText = `${filterCategory} ${req.body.tags.join(" ")}`;
    const embedding = await getEmbedding(combinedText);
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
        .select("_id yogaCategory slug")
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
    const yogaCategory = await YogaCategory.findOne({ slug: req.params.slug })
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
    // Find Classes
    // Find Instructor Whose education, profilePic present
    const instructorArray = await User.distinct("_id", {
      role: "instructor",
      $expr: { $gte: [{ $size: "$education" }, 1] },
      "profilePic.url": { $exists: true, $ne: null, $ne: "" },
    });
    // Query
    const date = new Date().toISOString().split("T")[0];
    const query = {
      instructor: { $in: instructorArray },
      isDelete: false,
      approvalByAdmin: "accepted",
      classStartTimeInUTC: { $gte: new Date(date) },
    };
    query.$expr = {
      $and: [
        {
          $gte: [
            { $divide: ["$price", "$numberOfClass"] },
            parseInt(PER_CLASS_PRICE_LIMIT),
          ],
        },
        { $lte: [{ $divide: ["$price", "$numberOfClass"] }, parseInt(100000)] },
      ],
    };
    query.yogaCategory = { $in: [yogaCategory._id] };
    console.log("here1");
    const classes = await YogaTutorClass.find(query)
      .select(
        "_id modeOfClass classType startDate endDate price time classStartTimeInUTC numberOfClass description packageType timeDurationInMin instructorTimeZone totalBookedSeat numberOfSeats isBooked"
      )
      .sort({ startDate: -1, endDate: -1 })
      .populate(
        "instructor",
        "_id name profilePic bio averageRating slug gender experience_year"
      )
      .populate(
        "datesOfClasses",
        "_id date startDateTimeUTC endDateTimeUTC classStatus"
      )
      .populate("yogaCategory", "yogaCategory slug description")
      .lean();
    const instructor = [];
    console.log("here2");
    const transformData = await Promise.all(
      classes.map(async (times) => {
        const datesOfClasses = [];
        for (let i = 0; i < times.datesOfClasses.length; i++) {
          const day = await getDatesDay(
            times.datesOfClasses[i].startDateTimeUTC
          );
          datesOfClasses.push({ ...times.datesOfClasses[i], day });
        }
        const alreadyExists = instructor.some(
          (item) => item._id === times.instructor._id
        );
        if (!alreadyExists) {
          instructor.push({
            ...times.instructor,
            profilePic: times.instructor.profilePic.url,
          });
        }
        return {
          ...times,
          datesOfClasses,
          instructor: {
            averageRating: times.instructor.averageRating,
            _id: times.instructor._id,
            name: times.instructor.name,
            profilePic: times.instructor.profilePic.url,
          },
        };
      })
    );
    return successResponse(res, 200, `Successfully!`, {
      yogaCategory,
      classes: transformData,
      instructor,
    });
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const getYogaCategoryWithImage = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query,
      yogaCategory,
      data = {},
      totalYogaCategory = {};
    if (req.query.search) {
      const queryForSearch = await finalQuery(req.query.search); // Query for first search
      const someCat = await YogaCategory.find(queryForSearch) // Search any data present
        .select("_id yogaCategory image slug")
        .lean();
      if (someCat.length > 2) {
        if (someCat.length >= 5) {
          yogaCategory = someCat.slice(0, 5);
        } else {
          const requiredResult = 5 - someCat.length;
          const result = await YogaCategory.aggregate([
            { $sample: { size: requiredResult } },
            { $project: { _id: 1, yogaCategory: 1, image: 1 } },
          ]);
          yogaCategory = [...someCat, ...result];
        }
      } else {
        // If not present data in query search then do embedded search
        const filterSearch = await removeSomeWord(req.query.search);
        const userEmbedding = await getEmbedding(filterSearch);
        const allCategory = await YogaCategory.find()
          .select("_id yogaCategory image embedding")
          .lean();
        const scoredCategories = allCategory.map((cat) => ({
          ...cat,
          similarity: cosineSimilarity(userEmbedding, cat.embedding),
        }));
        scoredCategories.sort((a, b) => b.similarity - a.similarity); // Descending order
        yogaCategory = scoredCategories.slice(0, 5); // Top 5 categories
      }
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
      await deleteSingleFile(req.file.path); // Delete file from server
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
      await deleteFileToBunny(bunnyFolderName, yogaCategories.image.fileName);
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
      await deleteFileToBunny(bunnyFolderName, yogaCategory.image.fileName);
    }
    // delete
    await YogaCategory.deleteOne({ _id: req.params.id });
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const updateYogaCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCategory(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { yogaCategory, tags, description } = req.body;
    // Find Category
    const category = await YogaCategory.findById(req.params.id).lean();
    if (!category) {
      return failureResponse(
        res,
        400,
        `This yoga category is not present!`,
        null
      );
    }
    // Check is new category present
    if (category.yogaCategory !== yogaCategory) {
      const category = await YogaCategory.findOne({ yogaCategory })
        .select("_id")
        .lean();
      if (category) {
        return failureResponse(
          res,
          400,
          `This yoga category is already present!`,
          null
        );
      }
    }
    // Compare tags
    let embedding = category.embedding;
    const tagCam = await compareArrays(category.tags, tags);
    if (category.yogaCategory !== yogaCategory || !tagCam) {
      // Get Embedding
      const filterCategory = await removeSomeWord(yogaCategory);
      const combinedText = `${filterCategory} ${tags.join(" ")}`;
      embedding = await getEmbedding(combinedText);
    }
    // Update
    await YogaCategory.updateOne(
      { _id: req.params.id },
      {
        $set: {
          yogaCategory,
          tags,
          embedding,
          description,
        },
      }
    );
    return successResponse(res, 200, `Updated successfully!`);
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
  updateYogaCategory,
};

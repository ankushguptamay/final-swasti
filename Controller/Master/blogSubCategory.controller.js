import dotenv from "dotenv";
dotenv.config();

import { deleteSingleFile } from "../../Helper/fileHelper.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateBlogSubCategory,
  validateUpdateBlogSubCategory,
} from "../../MiddleWare/Validation/master.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_FOLDER;
import fs from "fs";
import { Blog } from "../../Model/Admin/blogModel.js";
import { BlogSubCategory } from "../../Model/Master/blogSubCategoryModel.js";
import { BlogCategory } from "../../Model/Master/blogCategoryModel.js";

const addBlogSubCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateBlogSubCategory(req.body);
    if (error) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { description, parentCategoryId, name } = req.body;
    // Find in data
    const subCategory = await BlogSubCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      parentCategory: parentCategoryId,
    }).lean();
    if (subCategory) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, "This sub category already exist!");
    }
    // Upload file to bunny
    const image = {};
    if (req.file) {
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      // Delete file from server
      deleteSingleFile(req.file.path);
      image.fileName = req.file.filename;
      image.url = `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`;
    }
    // Create or update
    await BlogSubCategory.create({
      description,
      name,
      image,
      parentCategory: parentCategoryId,
    });
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogSubCategory = async (req, res) => {
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
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.name = withIn;
    }
    const [blogSubCategory, totalBlogSubCategory] = await Promise.all([
      BlogSubCategory.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug description")
        .lean(),
      BlogSubCategory.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogSubCategory / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: blogSubCategory,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogSubCategoryByCategoryID = async (req, res) => {
  try {
    const parentCategorySlug = req.params.parentCategorySlug;
    const { search } = req.query;
    //Search
    const category = await BlogCategory.findOne({ slug: parentCategorySlug })
      .select("_id")
      .lean();
    if (!category) {
      return failureResponse(res, 400, `This category is not present!`);
    }

    const query = { parentCategory: category._id };
    if (search) {
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.name = withIn;
    }
    const blogSubCategory = await BlogSubCategory.find(query)
      .sort({ name: 1 })
      .select("_id name slug")
      .lean();
    return successResponse(res, 200, `Successfully!`, {
      data: blogSubCategory,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const blogSubCategoryDetails = async (req, res) => {
  try {
    const blogSubCategory = await BlogSubCategory.findOne({
      slug: req.params.slug,
    })
      .select("name description image slug")
      .lean();
    if (!blogSubCategory) {
      return failureResponse(
        res,
        400,
        `This sub category is not present!`,
        null
      );
    }
    blogSubCategory.image = blogSubCategory.image
      ? blogSubCategory.image.url || null
      : null;
    return successResponse(res, 200, `Successfully!`, blogSubCategory);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogSubCategoryWithImageByCategoryId = async (req, res) => {
  try {
    const parentCategorySlug = req.params.parentCategorySlug;
    const { search } = req.query;
    //Search
    const category = await BlogCategory.findOne({ slug: parentCategorySlug })
      .select("_id")
      .lean();
    if (!category) {
      return failureResponse(res, 400, `This category is not present!`);
    }

    const query = { parentCategory: category._id };
    if (search) {
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.name = withIn;
    }
    const blogSubCategory = await BlogSubCategory.find(query)
      .sort({ name: 1 })
      .select("_id name slug image")
      .lean();
    // TransForm
    const blog = blogSubCategory.map(({ name, _id, slug, image }) => {
      return { name, _id, slug, image: image ? image.url || null : null };
    });
    return successResponse(res, 200, `Successfully!`, { data: blog });
  } catch (err) {
    failureResponse(res);
  }
};

const deleteBlogSubCategory = async (req, res) => {
  try {
    const blog = await BlogSubCategory.findOne({ _id: req.params.id }).lean();
    if (!blog) {
      return failureResponse(
        res,
        400,
        `This sub category is not present!`,
        null
      );
    }
    // Pull From Blog
    await Blog.updateMany(
      { subCategory: blog.name.toLowerCase() },
      { $pull: { subCategory: blog.name.toLowerCase() } }
    );
    // Delete image
    if (blog.image && blog.image.fileName) {
      await deleteFileToBunny(bunnyFolderName, blog.image.fileName);
    }
    // delete
    await BlogSubCategory.deleteOne({ _id: req.params.id });
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const updateBlogSubCategoryImage = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    const id = req.params.id;
    const blogSubCategories = await BlogSubCategory.findById(id).lean();
    if (!blogSubCategories) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(
        res,
        400,
        `This sub category is not present!`,
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
    if (blogSubCategories.image && blogSubCategories.image.fileName) {
      await deleteFileToBunny(
        bunnyFolderName,
        blogSubCategories.image.fileName
      );
    }
    // Update record
    await BlogSubCategory.updateOne({ _id: id }, { $set: { image } });
    return successResponse(res, 201, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const updateBlogSubCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUpdateBlogSubCategory(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { description } = req.body;
    // Find Category
    const category = await BlogSubCategory.findById(req.params.id).lean();
    if (!category) {
      return failureResponse(
        res,
        400,
        `This sub category is not present!`,
        null
      );
    }
    // Update
    await BlogSubCategory.updateOne(
      { _id: req.params.id },
      { $set: { description } }
    );
    return successResponse(res, 200, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addBlogSubCategory,
  getBlogSubCategoryByCategoryID,
  blogSubCategoryDetails,
  getBlogSubCategoryWithImageByCategoryId,
  deleteBlogSubCategory,
  updateBlogSubCategoryImage,
  updateBlogSubCategory,
  getBlogSubCategory,
};

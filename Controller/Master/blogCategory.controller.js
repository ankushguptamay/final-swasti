import dotenv from "dotenv";
dotenv.config();

import { deleteSingleFile } from "../../Helper/fileHelper.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateBlogCategory } from "../../MiddleWare/Validation/master.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_FOLDER;
import fs from "fs";
import { BlogCategory } from "../../Model/Master/blogCategoryModel.js";
import { Blog } from "../../Model/Admin/blogModel.js";
import slugify from "slugify";
import { BlogSubCategory } from "../../Model/Master/blogSubCategoryModel.js";

const addBlogCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateBlogCategory(req.body);
    if (error) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { description, name } = req.body;
    // Find in data
    const category = await BlogCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }).lean();
    if (category) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, "This blog category already exist!");
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
    await BlogCategory.create({ description, name, image });
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogCategory = async (req, res) => {
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
    const [blogCategory, totalBlogCategory] = await Promise.all([
      BlogCategory.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug")
        .lean(),
      BlogCategory.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogCategory / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: blogCategory,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const blogCategoryDetails = async (req, res) => {
  try {
    const blogCategory = await BlogCategory.findOne({ slug: req.params.slug })
      .select("name description image slug")
      .lean();
    if (!blogCategory) {
      return failureResponse(
        res,
        400,
        `This blog category is not present!`,
        null
      );
    }
    blogCategory.image = blogCategory.image
      ? blogCategory.image.url || null
      : null;
    return successResponse(res, 200, `Successfully!`, blogCategory);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogCategoryWithImage = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    const query = {};
    if (search) {
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.name = withIn;
    }
    const [blogCategory, totalBlogCategory] = await Promise.all([
      BlogCategory.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug image description")
        .lean(),
      BlogCategory.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalBlogCategory / resultPerPage) || 0;
    // TransForm
    const blog = blogCategory.map(({ name, _id, slug, image, description }) => {
      return {
        name,
        _id,
        slug,
        image: image ? image.url || null : null,
        description,
      };
    });
    return successResponse(res, 200, `Successfully!`, {
      data: blog,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const updateBlogCategoryImage = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    const id = req.params.id;
    const blogCategories = await BlogCategory.findById(id).lean();
    if (!blogCategories) {
      await deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(
        res,
        400,
        `This blog category is not present!`,
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
    if (blogCategories.image && blogCategories.image.fileName) {
      deleteFileToBunny(bunnyFolderName, blogCategories.image.fileName);
    }
    // Update record
    await BlogCategory.updateOne({ _id: id }, { $set: { image } });
    return successResponse(res, 201, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteBlogCategory = async (req, res) => {
  try {
    const blog = await BlogCategory.findOne({ _id: req.params.id }).lean();
    if (!blog) {
      return failureResponse(
        res,
        400,
        `This blog category is not present!`,
        null
      );
    }
    // Delete from all place
    const allSubCategory = await BlogSubCategory.find({
      parentCategory: req.params.id,
    })
      .select("name image")
      .lean();
    await Promise.all(
      allSubCategory.map(async ({ name, image }) => {
        if (image && image.fileName)
          await deleteFileToBunny(bunnyFolderName, image.fileName);
        await Blog.updateMany(
          { subCategory: name },
          { $pull: { subCategory: name } }
        );
      })
    );
    await BlogSubCategory.deleteMany({ parentCategory: req.params.id });
    await Blog.updateMany(
      { category: blog._id },
      { $pull: { category: blog._id } }
    );
    // Delete image
    if (blog.image && blog.image.fileName) {
      await deleteFileToBunny(bunnyFolderName, blog.image.fileName);
    }
    // delete
    await BlogCategory.deleteOne({ _id: req.params.id });
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const updateBlogCategory = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateBlogCategory(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { name, description } = req.body;
    // Find Category
    const category = await BlogCategory.findById(req.params.id).lean();
    if (!category) {
      return failureResponse(
        res,
        400,
        `This blog category is not present!`,
        null
      );
    }
    let slug = category.slug;
    // Check is new category present
    if (category.name !== name) {
      const category = await BlogCategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      })
        .select("_id")
        .lean();
      if (category) {
        return failureResponse(
          res,
          400,
          `This blog category is already present!`,
          null
        );
      }
      slug = slugify(name, { lower: true });
    }
    // Update
    await BlogCategory.updateOne(
      { _id: req.params.id },
      { $set: { name, slug, description } }
    );
    return successResponse(res, 200, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addBlogCategory,
  getBlogCategory,
  blogCategoryDetails,
  updateBlogCategoryImage,
  deleteBlogCategory,
  getBlogCategoryWithImage,
  updateBlogCategory,
};

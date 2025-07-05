import dotenv from "dotenv";
dotenv.config();

import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateBlogTag } from "../../MiddleWare/Validation/master.js";
import { BlogTag } from "../../Model/Master/blogTagsModel.js";
import { Blog } from "../../Model/Admin/blogModel.js";
import slugify from "slugify";

const addBlogTag = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateBlogTag(req.body);
    if (error) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { description, name } = req.body;
    // Find in data
    const tag = await BlogTag.findOne({
      name: new RegExp(name.trim(), "i"),
    }).lean();
    if (tag) {
      return failureResponse(res, 400, "This blog tag already exist!");
    }
    // Create or update
    await BlogTag.create({ description, name });
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogTag = async (req, res) => {
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
    const [blogTag, totalBlogTag] = await Promise.all([
      BlogTag.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug")
        .lean(),
      BlogTag.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogTag / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: blogTag,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const blogTagDetails = async (req, res) => {
  try {
    const tag = await BlogTag.findOne({ slug: req.params.slug })
      .select("name description image slug")
      .lean();
    if (!tag) {
      return failureResponse(res, 400, `This blog tag is not present!`, null);
    }
    return successResponse(res, 200, `Successfully!`, tag);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteBlogTag = async (req, res) => {
  try {
    const tag = await BlogTag.findOne({ _id: req.params.id }).lean();
    if (!tag) {
      return failureResponse(res, 400, `This blog tag is not present!`, null);
    }
    // Pull from blog
    await Blog.updateMany(
      { tag: tag.name.toLowerCase() },
      { $pull: { tag: tag.name.toLowerCase() } }
    );
    // delete
    await BlogTag.deleteOne({ _id: req.params.id });
    return successResponse(res, 200, `Deleted successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const updateBlogTag = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateBlogTag(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { name, description } = req.body;
    // Find tag
    const tag = await BlogTag.findById(req.params.id).lean();
    if (!tag) {
      return failureResponse(res, 400, `This blog tag is not present!`, null);
    }
    let slug = tag.slug;
    // Check is new tag present
    if (tag.name !== name) {
      const isTag = await BlogTag.findOne({ name }).select("_id").lean();
      if (isTag) {
        return failureResponse(
          res,
          400,
          `This blog tag is already present!`,
          null
        );
      }
      slug = slugify(name, { lower: true });
    }
    // Update
    await BlogTag.updateOne(
      { _id: req.params.id },
      { $set: { name, slug, description } }
    );
    return successResponse(res, 200, `Updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

export { addBlogTag, getBlogTag, blogTagDetails, deleteBlogTag, updateBlogTag };

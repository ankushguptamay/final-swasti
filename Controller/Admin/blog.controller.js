import dotenv from "dotenv";
dotenv.config();

import slugify from "slugify";
import { deleteSingleFile } from "../../Helper/fileHelper.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { Blog } from "../../Model/Admin/blogModel.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_FOLDER;
import fs from "fs";
import {
  blogValidation,
  deleteAdditionalPicValidation,
  publishBlogValidation,
} from "../../MiddleWare/Validation/blog.js";

const createBlog = async (req, res) => {
  try {
    // Body Validation
    const { error } = blogValidation(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { subCategory = [], tag = [], title, publishDate } = req.body;

    const isBlog = await Blog.findOne({ title });
    if (isBlog) {
      return failureResponse(res, 400, `Blog title should be unique!`);
    }
    const data = {
      ...req.body,
      tag: tag.map((t) => t.toLowerCase()),
      subCategory: subCategory.map((s) => s.toLowerCase()),
      title,
      publishDate: new Date(publishDate),
    };
    // Create this if not exist
    await Blog.create(data);
    return successResponse(res, 201, `Added successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const addUpdateBlogFeaturedPic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return failureResponse(res, 400, "Please..upload a feature image!", null);
    }
    const isBlog = await Blog.findById(req.params.id).lean();
    if (!isBlog) {
      deleteSingleFile(req.file.path);
      return failureResponse(res, 400, `This blog is not present!`);
    }

    //Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);
    const featuredPic = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };

    let message = "Featured pic added successfully!";
    if (isBlog.featuredPic && isBlog.featuredPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, isBlog.featuredPic.fileName);
      message = "Featured pic updated successfully!";
    }

    await Blog.updateOne({ _id: req.params.id }, { $set: { featuredPic } });
    // Final response
    return successResponse(res, 201, message);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteBlogFeaturedPic = async (req, res) => {
  try {
    const isBlog = await Blog.findById(req.params.id).lean();
    if (!isBlog) {
      return failureResponse(res, 400, `This blog is not present!`);
    }

    if (isBlog.featuredPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, isBlog.featuredPic.fileName);
    }
    const featuredPic = { fileName: null, url: null };
    await Blog.updateOne({ _id: req.params.id }, { $set: { featuredPic } });
    // Final response
    return successResponse(res, 200, "Featured pic deleted successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const deleteAdditionalBlogPic = async (req, res) => {
  try {
    // Body Validation
    const { error } = deleteAdditionalPicValidation(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const additionalPicId = req.body.additionalPicId;
    const isBlog = await Blog.findOne({
      _id: req.params.id,
      "additionalPic._id": additionalPicId,
    }).lean();
    if (!isBlog) {
      return failureResponse(
        res,
        400,
        `This blog or this additional pic is not present!`
      );
    }

    const additionalPic = isBlog.additionalPic;
    const newAdditionalPic = [];
    for (let i = 0; i < additionalPic.length; i++) {
      if (additionalPic[i]._id.toString() == additionalPicId.toString()) {
        if (additionalPic[i].fileName) {
          await deleteFileToBunny(bunnyFolderName, additionalPic[i].fileName);
        }
      } else {
        newAdditionalPic.push(additionalPic[i]);
      }
    }

    await Blog.updateOne(
      { _id: req.params.id },
      { $set: { additionalPic: newAdditionalPic } }
    );
    // Final response
    return successResponse(res, 200, "Additional pic deleted successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const addAdditionalBlogPic = async (req, res) => {
  try {
    // File should be exist
    if (!req.files) {
      return failureResponse(
        res,
        400,
        "Please..upload atleast an additional image!",
        null
      );
    }

    const isBlog = await Blog.findById(req.params.id).lean();
    if (!isBlog) {
      for (let i = 0; i < req.files.length; i++) {
        deleteSingleFile(req.files[i].path);
      }
      return failureResponse(res, 400, `This blog is not present!`);
    }
    const additionalPic = isBlog.additionalPic;
    const maxFileUpload = 5;
    const currentUploadedPics = additionalPic.length;
    const fileCanUpload = maxFileUpload - currentUploadedPics;
    let fileUploaded = 0;
    //Upload file to bunny
    for (let i = 0; i < req.files.length; i++) {
      if (i < fileCanUpload) {
        //Upload file
        const fileStream = fs.createReadStream(req.files[i].path);
        await uploadFileToBunny(
          bunnyFolderName,
          fileStream,
          req.files[i].filename
        );
        additionalPic.push({
          url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.files[i].filename}`,
          fileName: req.files[i].filename,
        });
        fileUploaded = fileUploaded + 1;
      }
      deleteSingleFile(req.files[i].path);
    }

    await Blog.updateOne({ _id: req.params.id }, { $set: { additionalPic } });
    // Final response
    return successResponse(
      res,
      201,
      `${fileUploaded} additional pic added successfully!`
    );
  } catch (err) {
    failureResponse(res);
  }
};

const updateBlog = async (req, res) => {
  try {
    // Body Validation
    const { error } = blogValidation(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { tag = [], title = [], subCategory, publishDate } = req.body;

    const isBlog = await Blog.findById(req.params.id).lean();
    if (!isBlog) {
      return failureResponse(res, 400, `This blog is not present!`);
    }

    let slug = isBlog.slug;
    if (title !== isBlog.title) {
      const isSlug = await Blog.findOne({ title });
      if (isSlug) {
        return failureResponse(res, 400, `Slug should be unique!`);
      }
      slug = slugify(title.trim(), { lower: true });
    }
    const data = {
      ...req.body,
      slug,
      subCategory: subCategory.map((s) => s.toLowerCase()),
      tag: tag.map((t) => t.toLowerCase()),
      publishDate: new Date(publishDate),
    };

    // update
    await Blog.updateOne({ _id: req.params.id }, { $set: data });
    return successResponse(res, 201, "Blog updated successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const deleteBlog = async (req, res) => {
  try {
    const isBlog = await Blog.findById(req.params.id).lean();
    if (!isBlog) {
      return failureResponse(res, 400, `This blog is not present!`);
    }

    // Delete Files
    if (isBlog.featuredPic && isBlog.featuredPic.fileName) {
      await deleteFileToBunny(bunnyFolderName, isBlog.featuredPic.fileName);
    }

    for (let i = 0; i < isBlog.additionalPic.length; i++) {
      if (isBlog.additionalPic[i].fileName) {
        await deleteFileToBunny(
          bunnyFolderName,
          isBlog.additionalPic[i].fileName
        );
      }
    }

    // delete
    await Blog.deleteOne({ _id: req.params.id });
    return successResponse(res, 200, "Blog deleted successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const publishBlog = async (req, res) => {
  try {
    // Body Validation
    const { error } = publishBlogValidation(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const status = req.body.status;
    const isBlog = await Blog.findById(req.params.id);
    if (!isBlog) {
      return failureResponse(res, 400, `This blog is not present!`);
    }

    await Blog.updateOne({ _id: req.params.id }, { $set: { status } });
    return successResponse(res, 201, `Blog ${status} successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogsForAdmin = async (req, res) => {
  try {
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = {};
    if (req.query.search) {
      const withIn = new RegExp(req.query.search.toLowerCase(), "i");
      query = { $or: [{ slug: withIn }, { title: withIn }] };
    }
    const [blog, totalBlogs] = await Promise.all([
      Blog.find(query)
        .select("title featuredPic slug readTime status tag publishDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("category", "name slug")
        .lean(),
      Blog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogs / resultPerPage) || 0;
    // Transform
    const trans = blog.map((blo) => {
      return {
        ...blo,
        featuredPic: blo.featuredPic ? blo.featuredPic.url || null : null,
      };
    });

    return successResponse(res, 200, "Blog fetched successfully!", {
      data: trans,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .lean()
      .populate("category", "name slug image description");
    if (!blog) {
      return failureResponse(res, 400, `This blog is not present!`);
    }
    blog.featuredPic = blog.featuredPic ? blog.featuredPic.url || null : null;
    blog.category = blog.category.map((cat) => {
      return { ...cat, image: cat.image ? cat.image.url || null : null };
    });
    return successResponse(res, 200, "Blog fetched successfully!", blog);
  } catch (err) {
    failureResponse(res);
  }
};

const getBlogBySlugForUser = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .lean()
      .populate("category", "name slug image description");
    if (!blog) {
      return failureResponse(res, 400, `This blog is not present!`);
    }
    blog.featuredPic = blog.featuredPic ? blog.featuredPic.url || null : null;
    blog.category = blog.category.map((cat) => {
      return { ...cat, image: cat.image ? cat.image.url || null : null };
    });
    // Similar blog
    const similarBlogs = await Blog.aggregate([
      {
        $match: {
          _id: { $ne: blog._id },
          $or: [
            { subCategory: { $in: blog.subCategory } },
            { tag: { $in: blog.tag } },
            { category: { $in: blog.category } },
          ],
        },
      },
      { $sample: { size: 5 } },
      {
        $lookup: {
          from: "blogcategories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);

    const transform = similarBlogs.map((blo) => {
      const category = Array.isArray(blo.category)
        ? blo.category.map((cat) => {
            return { ...cat, image: cat?.image?.url || null };
          })
        : [];
      const additionalPic = Array.isArray(blo.additionalPic)
        ? blo.additionalPic.map((pic) => pic.url)
        : [];
      return {
        ...blo,
        featuredPic: blo?.featuredPic?.url || null,
        category,
        additionalPic,
      };
    });
    return successResponse(res, 200, "Blog fetched successfully!", {
      ...blog,
      similarBlogs: transform,
    });
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const getBlogsForUser = async (req, res) => {
  try {
    const today = new Date();
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = { publishDate: { $lte: today }, status: "Published" };
    if (req.query.search) {
      const withIn = new RegExp(req.query.search.toLowerCase(), "i");
      query = { $or: [{ slug: withIn }, { title: withIn }] };
    }
    const [blog, totalBlogs] = await Promise.all([
      Blog.find(query)
        .select("title featuredPic slug readTime tag publishDate description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("category", "name slug")
        .lean(),
      Blog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogs / resultPerPage) || 0;
    // Transform
    const trans = blog.map((blo) => {
      return {
        ...blo,
        featuredPic: blo.featuredPic ? blo.featuredPic.url || null : null,
      };
    });

    return successResponse(res, 200, "Blog fetched successfully!", {
      data: trans,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export {
  getBlogsForUser,
  getBlogBySlug,
  getBlogsForAdmin,
  publishBlog,
  deleteBlog,
  updateBlog,
  addAdditionalBlogPic,
  deleteAdditionalBlogPic,
  deleteBlogFeaturedPic,
  addUpdateBlogFeaturedPic,
  createBlog,
  getBlogBySlugForUser,
};

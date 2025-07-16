import express from "express";
const router = express.Router();

import {
  addBlogTag,
  blogTagDetails,
  deleteBlogTag,
  getBlogTag,
  updateBlogTag,
} from "../../Controller/Master/blogTag.controller.js";
import {
  addBlogSubCategory,
  blogSubCategoryDetails,
  deleteBlogSubCategory,
  getBlogSubCategoryByCategoryID,
  getBlogSubCategoryWithImageByCategoryId,
  updateBlogSubCategory,
  updateBlogSubCategoryImage,
  getBlogSubCategory,
} from "../../Controller/Master/blogSubCategory.controller.js";
import {
  addBlogCategory,
  blogCategoryDetails,
  deleteBlogCategory,
  getBlogCategory,
  getBlogCategoryWithImage,
  updateBlogCategory,
  updateBlogCategoryImage,
} from "../../Controller/Master/blogCategory.controller.js";
import {
  addAdditionalBlogPic,
  addUpdateBlogFeaturedPic,
  createBlog,
  deleteAdditionalBlogPic,
  deleteBlog,
  deleteBlogFeaturedPic,
  getBlogBySlug,
  getBlogsForAdmin,
  publishBlog,
  updateBlog,
} from "../../Controller/Admin/blog.controller.js";

// MiddleWare
import { uploadImage } from "../../MiddleWare/uploadFile.js";

// blog tag
router.post("/blogTag", addBlogTag);
router.get("/blogTag", getBlogTag);
router.get("/blogTag/:slug", blogTagDetails);
router.put("/blogTag/:id", updateBlogTag);
router.delete("/blogTag/:id", deleteBlogTag);

// blog sub category
router.post("/blogSubCat", uploadImage.single("image"), addBlogSubCategory);
router.get("/blogSubCat", getBlogSubCategory);
router.get("/blogSubCat/:parentCategorySlug", getBlogSubCategoryByCategoryID);
router.get("/blogSubCat-details/:slug", blogSubCategoryDetails);
router.get(
  "/blogSubCat-i/:parentCategorySlug",
  getBlogSubCategoryWithImageByCategoryId
);
router.put(
  "/blogSubCat-i/:id",
  uploadImage.single("image"),
  updateBlogSubCategoryImage
);
router.put("/blogSubCat/:id", updateBlogSubCategory);
router.delete("/blogSubCat/:id", deleteBlogSubCategory);

// blog category
router.post("/blogCat", uploadImage.single("image"), addBlogCategory);
router.get("/blogCat", getBlogCategory);
router.get("/blogCat/:slug", blogCategoryDetails);
router.get("/blogCat-i", getBlogCategoryWithImage);
router.put(
  "/blogCat-i/:id",
  uploadImage.single("image"),
  updateBlogCategoryImage
);
router.put("/blogCat/:id", updateBlogCategory);
router.delete("/blogCat/:id", deleteBlogCategory);

// YTRequirement
router.post("/blog", createBlog);
router.get("/blog", getBlogsForAdmin);
router.get("/blog/:slug", getBlogBySlug);
router.put(
  "/blog-f-p/:id",
  uploadImage.single("image"),
  addUpdateBlogFeaturedPic
);
router.put(
  "/blog-a-p/:id",
  uploadImage.array("image", 5),
  addAdditionalBlogPic
);
router.put("/blog/:id", updateBlog);
router.put("/publishBlog/:id", publishBlog);
router.delete("/blog/:id", deleteBlog);
router.delete("/blog-f-p/:id", deleteBlogFeaturedPic);
router.delete("/blog-a-p/:id", deleteAdditionalBlogPic);

export default router;

import dotenv from "dotenv";
dotenv.config();

import { User } from "../Model/User/Profile/userModel.js";
import { failureResponse, successResponse } from "../MiddleWare/responseMiddleware.js";
import { YogaCategory } from "../Model/Master/yogaCategoryModel.js";
const { FRONT_HOST } = process.env;

const staticLinks = [
  {
    url: "/",
    changefreq: "monthly",
    priority: 1.0,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/expert",
    changefreq: "weekly",
    priority: 0.9,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/register",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/login",
    changefreq: "monthly",
    priority: 0.7,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/privacy-policy",
    changefreq: "yearly",
    priority: 0.5,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/cancellation-refund-policy",
    changefreq: "yearly",
    priority: 0.5,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/terms-conditions",
    changefreq: "yearly",
    priority: 0.5,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/contact-us",
    changefreq: "monthly",
    priority: 0.5,
    lastmod: new Date("2024-07-01").toISOString(),
  },
  {
    url: "/help-center",
    changefreq: "monthly",
    priority: 0.5,
    lastmod: new Date("2024-07-01").toISOString(),
  },
];

const instructorSiteMap = async (req, res) => {
  try {
    const instructors = await User.find({
      role: "instructor",
      $expr: { $gte: [{ $size: "$education" }, 1] },
      "profilePic.url": { $exists: true, $ne: null, $ne: "" },
      isDelete: false,
    })
      .select("slug updatedAt")
      .lean();

    const data = instructors.map((i) => ({
      url: `${FRONT_HOST}/instructor/${i.slug}`, // full URL path
      changefreq: "weekly",
      priority: 0.8,
      lastmod: i.updatedAt?.toISOString(),
    }));

    // Send final success response
    return successResponse(res, 200, "Successfully", data);
  } catch (err) {
    failureResponse(res);
  }
};

const staticSiteMap = async (req, res) => {
  try {
    const data = staticLinks.map((i) => ({
      url: `${FRONT_HOST}${i.url}`, // full URL path
      changefreq: i.changefreq,
      priority: i.priority,
      lastmod: i.lastmod,
    }));
    // Send final success response
    return successResponse(res, 200, "Successfully", data);
  } catch (err) {
    failureResponse(res);
  }
};

const classesSiteMap = async (req, res) => {
  try {
    const category = await YogaCategory.find().select("slug updatedAt").lean();

    const data = category.map((c) => ({
      url: `${FRONT_HOST}/categories/${c.slug}`, // full URL path
      changefreq: "weekly",
      priority: 0.8,
      lastmod: c.updatedAt?.toISOString(),
    }));

    // Send final success response
    return successResponse(res, 200, "Successfully", data);
  } catch (err) {
    failureResponse(res);
  }
};

export { instructorSiteMap, classesSiteMap, staticSiteMap };

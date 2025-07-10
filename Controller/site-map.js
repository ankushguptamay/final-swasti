import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import { User } from "../Model/User/Profile/userModel.js";
import { failureResponse } from "../MiddleWare/responseMiddleware.js";
import { YogaCategory } from "../Model/Master/yogaCategoryModel.js";

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
    const links = instructors.map((i) => ({
      url: `/instructor/${i.slug}`, // full URL path
      changefreq: "weekly",
      priority: 0.8,
      lastmod: i.updatedAt?.toISOString(),
    }));

    const stream = new SitemapStream({ hostname: "https://swastibharat.com" });
    res.header("Content-Type", "application/xml");

    const xmlString = await streamToPromise(
      Readable.from(links).pipe(stream)
    ).then((data) => data.toString());
    return res.send(xmlString);
  } catch (err) {
    failureResponse(res);
  }
};

const staticSiteMap = async (req, res) => {
  try {
    const stream = new SitemapStream({ hostname: "https://swastibharat.com" });
    res.header("Content-Type", "application/xml");

    const xml = await streamToPromise(
      Readable.from(staticLinks).pipe(stream)
    ).then((data) => data.toString());
    return res.send(xml);
  } catch (err) {
    failureResponse(res);
  }
};

const classesSiteMap = async (req, res) => {
  try {
    const category = await YogaCategory.find().select("slug updatedAt").lean();
    const links = category.map((c) => ({
      url: `/categories/${c.slug}`, // full URL path
      changefreq: "weekly",
      priority: 0.8,
      lastmod: c.updatedAt?.toISOString(),
    }));

    const stream = new SitemapStream({ hostname: "https://swastibharat.com" });
    res.header("Content-Type", "application/xml");

    const xmlString = await streamToPromise(
      Readable.from(links).pipe(stream)
    ).then((data) => data.toString());
    return res.send(xmlString);
  } catch (err) {
    failureResponse(res);
  }
};

export { instructorSiteMap, classesSiteMap, staticSiteMap };

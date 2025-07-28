import express from "express";
const router = express.Router();

// Routes
import admin from "./Admin/authAdmin.js";
import authUser from "./User/authUser.js";
import instructor from "./User/Instructor/index.js";
import learner from "./User/Learner/index.js";
import institute from "./Institute/mainInstitute.js";
import {
  classesSiteMap,
  instructorSiteMap,
  staticSiteMap,
} from "../Controller/site-map.js";

// Routes
router.use("/api/auth", authUser);
// 1.Instructor
router.use("/api/instructor", instructor);
// 2.User
router.use("/api/user", learner);
// 3.User
router.use("/api/admin", admin);
// 3.Institute
router.use("/api/institute", institute);

router.get("/sitemap-instructors.xml", instructorSiteMap);
router.get("/sitemap-static.xml", staticSiteMap);
router.get("/sitemap-classes.xml", classesSiteMap);
router.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  res.send(`
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://swastibharat.com/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://swastibharat.com/sitemap-instructors.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://swastibharat.com/sitemap-classes.xml</loc>
  </sitemap>
</sitemapindex>
  `);
});

export default router;

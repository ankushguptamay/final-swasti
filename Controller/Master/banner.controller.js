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
import { validateBanner } from "../../MiddleWare/Validation/master.js";
import fs from "fs";
import { Banner } from "../../Model/Master/bannerModel.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_FOLDER;

// Main Controller
const addBanner = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);
    // Body Validation
    const { error } = validateBanner(req.body);
    if (error) {
      // Delete file from server
      deleteSingleFile(req.file.path);
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { title, redirectLink } = req.body;
    const banner = await Banner.findOne({ title }).lean();
    if (banner) {
      deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, "This banner title present.", null);
    }
    // Compress File
    const buffer = fs.readFileSync(req.file.path);
    const compressedImagePath = await compressImageFile(buffer, req.file);
    // Upload file to bunny
    const fileStream = fs.createReadStream(compressedImagePath.imagePath);
    await uploadFileToBunny(
      bunnyFolderName,
      fileStream,
      compressedImagePath.imageName
    );
    // Delete file from server
    deleteSingleFile(compressedImagePath.imagePath);
    const bannerImage = {
      fileName: compressedImagePath.imageName,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${compressedImagePath.imageName}`,
    };
    // Store in database
    await Banner.create({ bannerImage, title, redirectLink });
    // Send final success response
    return successResponse(res, 201, `Banner added successfully.`);
  } catch (err) {
    failureResponse(res, 500, err, null);
  }
};

const getBanner = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Search
    const query = {};
    if (search) {
      const containInString = new RegExp(search, "i");
      query.title = containInString;
    }

    const [banner, totalBanner] = await Promise.all([
      Banner.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("title redirectLink bannerImage")
        .lean(),
      Banner.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBanner / resultPerPage) || 0;
    for (let i = 0; i < banner.length; i++) {
      banner[i].bannerImage = banner[i].bannerImage.url;
    }
    // Send final success response
    return successResponse(res, 200, `Banner fetched successfully.`, {
      banner,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const deleteBanner = async (req, res) => {
  try {
    // Find in database
    const banner = await Banner.findById(req.params.id);
    if (!banner)
      return failureResponse(res, 400, "This banner is not present.", null);
    await deleteFileToBunny(bunnyFolderName, banner.bannerImage.fileName);
    // Delete
    await banner.deleteOne();
    // Send final success response
    return successResponse(res, 200, `Banner deleted successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

export { addBanner, getBanner, deleteBanner };

import dotenv from "dotenv";
dotenv.config();

import {
  compressImageFile,
  deleteSingleFile,
} from "../../../Helper/fileHelper.js";
import fs from "fs";
import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import { validateCerificate } from "../../../MiddleWare/Validation/userProfile.js";
import { Certificate } from "../../../Model/User/Profile/certificateModel.js";
import { User } from "../../../Model/User/Profile/userModel.js";
import { uploadFileToBunny } from "../../../Util/bunny.js";
const bunnyFolderName = process.env.MASTER_PROFILE_FOLDER || "inst-doc";
const { SHOW_BUNNY_FILE_HOSTNAME } = process.env;

// Main Controller
const addCerificate = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(
        res,
        400,
        "Please..upload an image of certificate!",
        null
      );
    // Body Validation
    const { error } = validateCerificate(req.body);
    if (error) {
      deleteSingleFile(req.file.path);
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { name } = req.body;
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
    deleteSingleFile(compressedImagePath.imagePath);
    const image = {
      fileName: compressedImagePath.imageName,
      url: `${SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${compressedImagePath.imageName}`,
    };
    // Create this certificate
    const certificate = await Certificate.create({
      name,
      image,
      user: req.user._id,
    });
    // Update certificate array in user profile
    const user = await User.findById(req.user._id).select("certificate");
    user.certificate = [...user.certificate, certificate._id];
    await user.save();
    // Send final success response
    return successResponse(res, 201, `Certificate added successfully.`);
  } catch (err) {
    deleteSingleFile(req.file.path);
    failureResponse(res, 500, err.message, null);
  }
};

const certificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      user: req.user._id,
      isDelete: false,
    })
      .select("_id name image")
      .sort({
        createdAt: -1,
      });
    // Transform
    const transform = certificates.map(({ _id, name, image }) => {
      return { _id, name, image: image ? image.url || null : null };
    });
    // Send final success response
    return successResponse(res, 201, `Certificates fetched successfully!`, {
      certificates: transform,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const certificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    }).select("_id name image");
    // tranform
    certificate._doc.image = certificate.image
      ? certificate.image.url || null
      : null;
    // Send final success response
    return successResponse(res, 201, `Certificate fetched successfully!`, {
      certificate,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteCertificate = async (req, res) => {
  try {
    const certificates = await Certificate.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDelete: false,
    });
    if (!certificates)
      return failureResponse(res, 400, `Certificate detail does not exist!`);
    // Update isDelete
    certificates.isDelete = true;
    certificates.deleted_at = new Date();
    certificates.save();
    // Update certificate array in user profile
    const user = await User.findById(req.user._id).select("certificate");
    const certificate = [];
    for (const cer of user._doc.certificate) {
      if (cer.toString() !== certificates._doc._id.toString()) {
        certificate.push(cer);
      }
    }
    user.certificate = certificate;
    await user.save();
    // Send final success response
    return successResponse(res, 201, `Certificate deleted successfully.`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export { addCerificate, certificates, certificateById, deleteCertificate };

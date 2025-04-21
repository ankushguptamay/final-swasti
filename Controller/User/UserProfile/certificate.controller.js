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
import { validateApprovalClassTimes } from "../../../MiddleWare/Validation/slots.js";
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
    await Certificate.create({
      name,
      image,
      user: req.user._id,
    });
    // Send final success response
    return successResponse(res, 201, `Certificate added successfully.`);
  } catch (err) {
    deleteSingleFile(req.file.path);
    failureResponse(res);
  }
};

const certificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      user: req.user._id,
      isDelete: false,
      approvalByAdmin: "accepted",
    })
      .select("_id name image approvalByAdmin")
      .sort({
        createdAt: -1,
      });
    // Transform
    const transform = certificates.map(
      ({ _id, name, image, approvalByAdmin }) => {
        return {
          _id,
          name,
          approvalByAdmin,
          image: image ? image.url || null : null,
        };
      }
    );
    // Send final success response
    return successResponse(res, 201, `Certificates fetched successfully!`, {
      certificates: transform,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const certificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
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
    failureResponse(res);
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
    if (certificates.approvalByAdmin === "accepted") {
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
    }
    // Send final success response
    return successResponse(res, 201, `Certificate deleted successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const certificatesForAdminApproval = async (req, res) => {
  try {
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // Get required data
    const [certificates, totalcertificates] = await Promise.all([
      Certificate.find({ isDelete: false, approvalByAdmin: "pending" })
        .select("_id name image approvalByAdmin")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("user", "_id name profilePic")
        .lean(),
      Certificate.countDocuments({ isDelete: false }),
    ]);
    // Transform
    const transform = certificates.map(
      ({ _id, name, image, approvalByAdmin, user }) => {
        return {
          _id,
          name,
          approvalByAdmin,
          user: {
            _id: user._id,
            name: user.name,
            profilePic: user.profilePic ? user.profilePic.url || null : null,
          },
          image: image ? image.url || null : null,
        };
      }
    );
    const totalPages = Math.ceil(totalcertificates / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 201, `Successfully!`, {
      data: transform,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const certifiacteApproval = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateApprovalClassTimes(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const approvalByAdmin = req.body.approvalByAdmin;
    const _id = req.params.id;
    // Find record
    const certificate = await Certificate.findOne({
      _id,
      isDelete: false,
    }).select("approvalByAdmin");
    if (!certificate)
      return failureResponse(
        res,
        400,
        "This certificate is not present!",
        null
      );
    // Save History
    if (approvalByAdmin === "accepted") {
      // Update certificate array in user profile
      const user = await User.findById(req.user._id).select("certificate");
      user.certificate = [...user.certificate, certificate._id];
      await user.save();
    }
    // Save
    await certificate.updateOne({ $set: { approvalByAdmin } });
    // Send final success response
    return successResponse(
      res,
      201,
      `Certificate ${approvalByAdmin} successfully`
    );
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addCerificate,
  certificates,
  certificateById,
  deleteCertificate,
  certificatesForAdminApproval,
  certifiacteApproval,
};

import dotenv from "dotenv";
dotenv.config();

import { deleteSingleFile } from "../../Helper/fileHelper.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import fs from "fs";
import { validateYCBRegistrationForm } from "../../MiddleWare/Validation/institute.js";
import { YCBRegistrationForm } from "../../Model/Institute/YCB_registration_formModel.js";
import { uploadFileToBunny } from "../../Util/bunny.js";
const bunnyFolderName = process.env.INSTITUTE_FOLDER;

const createYCBRegistrationForm = async (req, res) => {
  try {
    // Making file mandetory
    // Access files
    const idImage = req.files?.["id_image"] ? req.files["id_image"][0] : null;
    const facePic = req.files?.["face_pic"] ? req.files["face_pic"][0] : null;
    if (!idImage || !facePic) {
      if (idImage) deleteSingleFile(idImage.path);
      if (facePic) deleteSingleFile(facePic.path);
      return failureResponse(res, 400, "Both file is madnatory");
    }hi
    // Body Validation
    const { error } = validateYCBRegistrationForm(req.body);
    if (error) {
      deleteSingleFile(idImage.path);
      deleteSingleFile(facePic.path);
      return failureResponse(res, 400, error.details[0].message, null);
    }
    // Upload to bunny
    const fileStream = fs.createReadStream(idImage.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, idImage.filename);
    const fileStreamFace = fs.createReadStream(facePic.path);
    await uploadFileToBunny(bunnyFolderName, fileStreamFace, facePic.filename);
    const id_image = {
      fileName: idImage.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${idImage.filename}`,
    };
    const face_pic = {
      fileName: facePic.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${facePic.filename}`,
    };
    deleteSingleFile(idImage.path);
    deleteSingleFile(facePic.path);
    await YCBRegistrationForm.create({
      ...req.body,
      dateOfBirth: new Date(dateOfBirth),
      id_image,
      face_pic,
      learner: req.user._id,
    });
    // Send final success response
    return successResponse(res, 201, "Submitted successfully!");
  } catch (err) {
    const idImage = req.files?.["id_image"] ? req.files["id_image"][0] : null;
    const facePic = req.files?.["face_pic"] ? req.files["face_pic"][0] : null;
    if (idImage) deleteSingleFile(idImage.path);
    if (facePic) deleteSingleFile(facePic.path);
    failureResponse(res);
  }
};

export { createYCBRegistrationForm };

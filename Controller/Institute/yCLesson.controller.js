import dotenv from "dotenv";
dotenv.config();

import { deleteSingleFile } from "../../Helper/fileHelper.js";
import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateYogaCourseLesson,
  validateYogaCourseLessonUpdation,
} from "../../MiddleWare/Validation/institute.js";
import { YCLesson } from "../../Model/Institute/yCLessonModel.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../Util/bunny.js";
import fs from "fs";
const bunnyFolderName = process.env.INSTITUTE_FOLDER;

const createYCBatchLesson = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourseLesson(req.body);
    if (error) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const {
      date,
      video,
      yogaCourseId,
      hls_url,
      videoTimeInMinute,
      thumbNailUrl,
    } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    let document;
    if (req.file) {
      // Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      document = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };
      // Delete file from server
      deleteSingleFile(req.file.path);
    }
    await YCLesson.create({
      name,
      video,
      date: new Date(date),
      yogaCourse: yogaCourseId,
      hls_url,
      videoTimeInMinute,
      thumbNailUrl,
      document,
    });
    // Send final success response
    return successResponse(res, 201, "Created successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const updateYCBatchLesson = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourseLessonUpdation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { date, video, hls_url, videoTimeInMinute, thumbNailUrl } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const lesson = await YCLesson.findById(req.params.yCLessonId)
      .select("_id")
      .lean();
    if (!lesson)
      return failureResponse(res, 400, "This lesson is not present!");
    await YCLesson.updateOne(
      { _id: req.params.yCLessonId },
      {
        $set: {
          name,
          video,
          date: new Date(date),
          hls_url,
          videoTimeInMinute,
          thumbNailUrl,
        },
      }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const updateLessonDocument = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an PDF", null);

    const lesson = await YCLesson.findById(req.params.yCLessonId)
      .select("_id document")
      .lean();
    if (!lesson) {
      deleteSingleFile(req.file.path);
      return failureResponse(res, 400, "This lesson is not present!");
    }

    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename); // Upload file to bunny
    const document = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    deleteSingleFile(req.file.path); // Delete file from server

    // Delete existing file from Bunny
    if (lesson.document && lesson.document.fileName) {
      await deleteFileToBunny(bunnyFolderName, lesson.document.fileName);
    }

    await YCLesson.updateOne(
      { _id: req.params.yCLessonId },
      { $set: { document } }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const deleteLessonDocument = async (req, res) => {
  try {
    const lesson = await YCLesson.findById(req.params.yCLessonId)
      .select("_id")
      .lean();
    if (!lesson) {
      return failureResponse(res, 400, "This lesson is not present!");
    }

    // Delete file from Bunny
    if (lesson.document && lesson.document.fileName) {
      await deleteFileToBunny(bunnyFolderName, lesson.document.fileName);
    }

    await YCLesson.updateOne(
      { _id: req.params.yCLessonId },
      { $set: { document: { fileName: null, url: null } } }
    );
    // Send final success response
    return successResponse(res, 200, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const lessonDetails = async (req, res) => {
  try {
    const lesson = await YCLesson.findById(req.params.yCLessonId)
      .select("name video date hls_url videoTimeInMinute thumbNailUrl document")
      .lean();
    if (!lesson) {
      return failureResponse(res, 400, "This lesson is not present!");
    }

    lesson.dateInIST = new Date(
      new Date(lesson.date).getTime() + 330 * 60 * 1000
    );

    // Send final success response
    return successResponse(res, 200, "Successfully!", lesson);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  createYCBatchLesson,
  updateYCBatchLesson,
  updateLessonDocument,
  deleteLessonDocument,
  lessonDetails,
};

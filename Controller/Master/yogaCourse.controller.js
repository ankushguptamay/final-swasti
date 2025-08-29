import dotenv from "dotenv";
dotenv.config();

import { deleteSingleFile } from "../../Helper/fileHelper.js";
import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateUpdateYogaCourse,
  validateYogaCourse,
} from "../../MiddleWare/Validation/master.js";
import { MasterYogaCourse } from "../../Model/Master/yogaCousreModel.js";
import {
  deleteFileToBunny,
  deleteVideoToBunny,
  uploadFileToBunny,
  uploadVideoThumbnailToBunny,
  uploadVideoToBunny,
} from "../../Util/bunny.js";
import fs from "fs";
import { YCReviewVideo } from "../../Model/Institute/yogaCourseReviewVideoModel.js";
import { YogaCourseReview } from "../../Model/Institute/yCReviewModel.js";
import { YogaCourse } from "../../Model/Institute/yCBatchMode.js";
const bunnyFolderName = process.env.INSTITUTE_FOLDER;
const {
  INSTITUTE_LIBRARY_API_KEY,
  INSTITUTE_VIDEO_LIBRARY_ID,
  INSTITUTE_CDN_HOST,
} = process.env;

const createYogaCourse = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateYogaCourse(req.body);
    if (error) {
      if (req.file) deleteSingleFile(req.file.path); // Delete file from server
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { time_hours, description, amount } = req.body;
    const title = capitalizeFirstLetter(
      req.body.title.replace(/\s+/g, " ").trim()
    );
    let image;
    if (req.file) {
      // Upload file to bunny
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
      image = {
        fileName: req.file.filename,
        url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      };
      // Delete file from server
      deleteSingleFile(req.file.path);
    }
    await MasterYogaCourse.create({
      title,
      time_hours,
      description,
      image,
      amount,
    });
    // Send final success response
    return successResponse(res, 201, "Created successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const updateYogaCourse = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUpdateYogaCourse(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { time_hours, description } = req.body;
    const course = await MasterYogaCourse.findById(req.params.yCId)
      .select("_id")
      .lean();
    if (!course)
      return failureResponse(res, 400, "This Yoga Course is not present!");
    await MasterYogaCourse.updateOne(
      { _id: req.params.yCId },
      { $set: { time_hours, description } }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const updateYogaCourseImage = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload an image!", null);

    const course = await MasterYogaCourse.findById(req.params.yCId)
      .select("_id image descriptive_video")
      .lean();
    if (!course) {
      deleteSingleFile(req.file.path);
      return failureResponse(res, 400, "This Yoga Course is not present!");
    }

    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename); // Upload file to bunny
    const image = {
      fileName: req.file.filename,
      url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    deleteSingleFile(req.file.path); // Delete file from server
    // Delete existing file from Bunny
    if (course.image && course.image.fileName) {
      await deleteFileToBunny(bunnyFolderName, course.image.fileName);
    }
    // Set as thumbnail
    if (course.descriptive_video && course.descriptive_video.videoId) {
      await uploadVideoThumbnailToBunny(
        INSTITUTE_VIDEO_LIBRARY_ID,
        INSTITUTE_LIBRARY_API_KEY,
        course.descriptive_video.videoId,
        image.url
      );
    }
    await MasterYogaCourse.updateOne(
      { _id: req.params.yCId },
      { $set: { image } }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const addUpdateYogaCourseDescriptiveVideo = async (req, res) => {
  try {
    // Velidation
    if (!req.file) return failureResponse(res, 400, "Select a video file!");
    if (req.file.mimetype.startsWith("video") === false) {
      delete req.file.buffer;
      return failureResponse(res, 400, "Select only a video file!");
    }
    // Find Course
    const course = await MasterYogaCourse.findById(req.params.yCId)
      .select("_id descriptive_video image")
      .lean();
    if (!course) {
      delete req.file;
      return failureResponse(res, 400, "This Yoga Course is not present!");
    }

    // upload video to bunny
    const video = await uploadVideoToBunny(
      INSTITUTE_VIDEO_LIBRARY_ID,
      INSTITUTE_LIBRARY_API_KEY,
      req.file
    );
    delete req.file;
    const descriptive_video = {
      videoId: video.video_id,
      thumbnail_url: `${INSTITUTE_CDN_HOST}/${video.video_id}/thumbnail.jpg`,
      web_url: `https://iframe.mediadelivery.net/embed/${INSTITUTE_VIDEO_LIBRARY_ID}/${video.video_id}`,
      hls_url: `${INSTITUTE_CDN_HOST}/${video.video_id}/playlist.m3u8`,
    };
    // Delete existing video if present
    if (course.descriptive_video && course.descriptive_video.videoId) {
      await deleteVideoToBunny(
        INSTITUTE_VIDEO_LIBRARY_ID,
        INSTITUTE_LIBRARY_API_KEY,
        course.descriptive_video.videoId
      );
    }
    // Set thumbnail
    if (course.image && course.image.url) {
      await uploadVideoThumbnailToBunny(
        INSTITUTE_VIDEO_LIBRARY_ID,
        INSTITUTE_LIBRARY_API_KEY,
        descriptive_video.videoId,
        course.image.url
      );
    }
    // Update
    await MasterYogaCourse.updateOne(
      { _id: req.params.yCId },
      { $set: { descriptive_video } }
    );
    // Send final success response
    return successResponse(res, 201, "Successfully!");
  } catch (err) {
    delete req.file;
    failureResponse(res);
  }
};

const deleteYogaCourseDescriptiveVideo = async (req, res) => {
  try {
    // Find Course
    const course = await MasterYogaCourse.findById(req.params.yCId)
      .select("_id descriptive_video")
      .lean();
    if (!course) {
      return failureResponse(res, 400, "This Yoga Course is not present!");
    }

    const descriptive_video = {
      videoId: null,
      thumbnail_url: null,
      web_url: null,
      hls_url: null,
    };
    // Delete existing video if present
    if (course.descriptive_video && course.descriptive_video.videoId) {
      await deleteVideoToBunny(
        INSTITUTE_VIDEO_LIBRARY_ID,
        INSTITUTE_LIBRARY_API_KEY,
        course.descriptive_video.videoId
      );
    }
    // Update
    await MasterYogaCourse.updateOne(
      { _id: req.params.yCId },
      { $set: { descriptive_video } }
    );
    // Send final success response
    return successResponse(res, 200, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

const yogaCourseDetails = async (req, res) => {
  try {
    // Find Course
    const course = await MasterYogaCourse.findOne({ slug: req.params.slug })
      .select("-createdAt -updatedAt")
      .lean();
    if (!course) {
      return failureResponse(res, 400, "This Yoga Course is not present!");
    }

    const [videoReview, userReview, batch, result] = await Promise.all([
      YCReviewVideo.find({
        masterYogaCourse: course._id,
      })
        .select("-createdAt -updatedAt")
        .lean(),
      YogaCourseReview.find({ masterYC: course._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("rating message")
        .populate("learner", "_id name profilePic")
        .lean(),
      YogaCourse.find({ masterYC: course._id, startDate: { $gt: new Date() } })
        .sort({ startDate: 1 })
        .select("_id name slug startDate totalEnroll batchNumber")
        .lean(),
      YogaCourse.aggregate([
        { $match: { masterYC: course._id } },
        {
          $group: {
            _id: null,
            totalEnrolledUser: { $sum: "$totalEnroll" },
          },
        },
      ]),
    ]);

    course.image = course.image ? course.image.url || null : null;
    for (let i = 0; i < userReview.length; i++) {
      userReview[i].learner = {
        ...userReview[i].learner,
        profilePic: userReview[i].learner.profilePic
          ? userReview[i].learner.profilePic.url || null
          : null,
      };
    }
    for (let i = 0; i < batch.length; i++) {
      batch[i].startDateInIST = new Date(
        new Date(batch[i].startDate).getTime() + 330 * 60 * 1000
      );
    }
    const totalEnrolledUser =
      result.length > 0 ? result[0].totalEnrolledUser : 0;
    // Send final success response
    return successResponse(res, 200, "Successfully!", {
      ...course,
      videoReview,
      userReview,
      batch,
      totalEnrolledUser,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const yogaCourse = async (req, res) => {
  try {
    // Find Course
    const course = await MasterYogaCourse.find()
      .select("title image amount slug time_hours averageRating")
      .lean();
    for (let i = 0; i < course.length; i++) {
      course[i].image = course[i].image ? course[i].image.url || null : null;
    }
    for (let i = 0; i < course.length; i++) {
      const result = await YogaCourse.aggregate([
        { $match: { masterYC: course[i]._id } },
        {
          $group: {
            _id: null,
            totalEnrolledUser: { $sum: "$totalEnroll" },
          },
        },
      ]);
      const totalEnrolledUser =
        result.length > 0 ? result[0].totalEnrolledUser : 0;
      course[i].totalEnrolledUser = totalEnrolledUser;
    }
    // Send final success response
    return successResponse(res, 200, "Successfully!", course);
  } catch (err) {
    failureResponse(res);
  }
};

const yogaCourseForDropdown = async (req, res) => {
  try {
    // Find Course
    const course = await MasterYogaCourse.find().select("title").lean();
    // Send final success response
    return successResponse(res, 200, "Successfully!", course);
  } catch (err) {
    failureResponse(res);
  }
};

export {
  addUpdateYogaCourseDescriptiveVideo,
  createYogaCourse,
  updateYogaCourse,
  updateYogaCourseImage,
  deleteYogaCourseDescriptiveVideo,
  yogaCourseDetails,
  yogaCourseForDropdown,
  yogaCourse,
};

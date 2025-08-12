import dotenv from "dotenv";
dotenv.config();

import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { deleteVideoToBunny, uploadVideoToBunny } from "../../Util/bunny.js";
import { YCReviewVideo } from "../../Model/Institute/yogaCourseReviewVideoModel.js";
import { validateYogaCourseVideoReview } from "../../MiddleWare/Validation/institute.js";
const {
  INSTITUTE_LIBRARY_API_KEY,
  INSTITUTE_VIDEO_LIBRARY_ID,
  INSTITUTE_CDN_HOST,
} = process.env;

const addYogaCourseReviewVideo = async (req, res) => {
  try {
    // Velidation
    if (!req.file) return failureResponse(res, 400, "Select a video file!");
    // Body Validation
    const { error } = validateYogaCourseVideoReview(req.body);
    if (error) {
      delete req.file;
      return failureResponse(res, 400, error.details[0].message, null);
    }
    if (req.file.mimetype.startsWith("video") === false) {
      delete req.file;
      return failureResponse(res, 400, "Select only a video file!");
    }
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    // upload video to bunny
    const video = await uploadVideoToBunny(
      INSTITUTE_VIDEO_LIBRARY_ID,
      INSTITUTE_LIBRARY_API_KEY,
      req.file
    );
    delete req.file;
    const videoId = video.video_id;
    const thumbnail_url = `${INSTITUTE_CDN_HOST}/${video.video_id}/thumbnail.jpg`;
    const web_url = `https://iframe.mediadelivery.net/embed/${INSTITUTE_VIDEO_LIBRARY_ID}/${video.video_id}`;
    const hls_url = `${INSTITUTE_CDN_HOST}/${video.video_id}/playlist.m3u8`;

    // create
    await YCReviewVideo.create({
      name,
      videoId,
      thumbnail_url,
      web_url,
      hls_url,
      masterYogaCourse,
    });
    // Send final success response
    return successResponse(res, 201, "Successfully!");
  } catch (err) {
    delete req.file;
    failureResponse(res);
  }
};

const deleteYCRevieweVideo = async (req, res) => {
  try {
    const review = await YCReviewVideo.findById(req.params.reviewId)
      .select("_id videoId")
      .lean();
    if (!review) {
      return failureResponse(res, 400, "This review is not present!");
    }
    // Delete video
    await deleteVideoToBunny(
      INSTITUTE_VIDEO_LIBRARY_ID,
      INSTITUTE_LIBRARY_API_KEY,
      review.videoId
    );
    // delete
    await YCReviewVideo.deleteOne({ _id: req.params.reviewId });
    // Send final success response
    return successResponse(res, 200, "Successfully!");
  } catch (err) {
    failureResponse(res);
  }
};

export { addYogaCourseReviewVideo, deleteYCRevieweVideo };

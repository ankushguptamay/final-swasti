import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import axios from "axios";
const { BUNNY_HOSTNAME, BUNNY_STORAGE_ACCESS_KEY } = process.env;

const uploadFileToBunny = async (bunnyFolderName, fileStream, filename) => {
  return new Promise((resolve, reject) => {
    axios
      .put(`${BUNNY_HOSTNAME}/${bunnyFolderName}/${filename}`, fileStream, {
        headers: {
          AccessKey: BUNNY_STORAGE_ACCESS_KEY,
        },
      })
      .then(
        (data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
  });
};

const uploadVideoToBunny = async (
  BUNNY_VIDEO_LIBRARY_ID,
  BUNNY_LIBRARY_API_KEY,
  file
) => {
  try {
    const optionsToCreateVideo = {
      method: "POST",
      url: `http://video.bunnycdn.com/library/${BUNNY_VIDEO_LIBRARY_ID}/videos/`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: BUNNY_LIBRARY_API_KEY,
      },
      data: JSON.stringify({ title: file.originalname }),
    };
    const createFolder = await axios.request(optionsToCreateVideo);
    const video_id = createFolder.data.guid;
    const video = file.buffer;
    const response = await axios.put(
      `http://video.bunnycdn.com/library/${BUNNY_VIDEO_LIBRARY_ID}/videos/${video_id}`,
      video,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          AccessKey: BUNNY_LIBRARY_API_KEY,
        },
      }
    );
    return { ...response.data, video_id };
  } catch (err) {
    console.error("Error", err);
    throw err;
  }
};

const deleteVideoToBunny = async (
  BUNNY_VIDEO_LIBRARY_ID,
  BUNNY_LIBRARY_API_KEY,
  Video_ID
) => {
  try {
    const response = await axios.delete(
      `http://video.bunnycdn.com/library/${BUNNY_VIDEO_LIBRARY_ID}/videos/${Video_ID}`,
      {
        headers: {
          AccessKey: BUNNY_LIBRARY_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const uploadVideoThumbnailToBunny = async (
  BUNNY_VIDEO_LIBRARY_ID,
  BUNNY_LIBRARY_API_KEY,
  Video_ID,
  thumbnail
) => {
  try {
    const setThumbNail = {
      method: "POST",
      url: `http://video.bunnycdn.com/library/${BUNNY_VIDEO_LIBRARY_ID}/videos/${Video_ID}/thumbnail`,
      params: {
        thumbnailUrl: thumbnail,
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: BUNNY_LIBRARY_API_KEY,
      },
    };
    const response = await axios.request(setThumbNail);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteFileToBunny = async (bunnyFolderName, filename) => {
  return new Promise((resolve, reject) => {
    axios
      .delete(`${BUNNY_HOSTNAME}/${bunnyFolderName}/${filename}`, {
        headers: {
          AccessKey: BUNNY_STORAGE_ACCESS_KEY,
        },
      })
      .then(
        (data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
  });
};

const getVideoIdFromBunny = async (
  BUNNY_VIDEO_LIBRARY_ID,
  BUNNY_LIBRARY_API_KEY,
  title
) => {
  try {
    const optionsToCreateVideo = {
      method: "POST",
      url: `http://video.bunnycdn.com/library/${BUNNY_VIDEO_LIBRARY_ID}/videos/`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: BUNNY_LIBRARY_API_KEY,
      },
      data: JSON.stringify({ title }),
    };
    const createFolder = await axios.request(optionsToCreateVideo);
    const video_id = createFolder.data.guid;

    const expireTime = Math.floor(Date.now() / 1000) + 7200; // 2 hour
    // Concatenate: libraryId + apiKey + expirationTime + videoId
    const rawString = `${BUNNY_VIDEO_LIBRARY_ID}${BUNNY_LIBRARY_API_KEY}${expireTime}${video_id}`;
    // SHA256 hash
    const signature = crypto
      .createHash("sha256")
      .update(rawString)
      .digest("hex");
    return {
      AuthorizationSignature: signature,
      AuthorizationExpire: expireTime,
      LibraryId: BUNNY_LIBRARY_ID,
      videoId: video_id,
      title,
    };
  } catch (err) {
    console.error("Error", err);
    throw err;
  }
};

export {
  uploadFileToBunny,
  deleteFileToBunny,
  uploadVideoToBunny,
  deleteVideoToBunny,
  uploadVideoThumbnailToBunny,
};

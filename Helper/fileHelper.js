import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import heicConvert from "heic-convert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deleteSingleFile = (filePath) => {
  if (filePath) {
    // console.log(fs.existsSync(filePath));
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }
};

const deleteMultiFile = (filePath) => {
  filePath.map((path) => {
    if (path) {
      if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    }
  });
};

const compressImageFile = async (bufferInput, file) => {
  const imagePath = path.join(
    __dirname,
    "..",
    "Resource",
    `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpeg`
  );
  const imageName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpeg`;
  const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) * 1024; // 200 KB in bytes
  let buffer = bufferInput;
  try {
    const ext = path.extname(file.path).toLowerCase();
    // Convert .heic to .jpeg
    if (ext === ".heic") {
      buffer = await heicConvert({
        buffer, // Input file buffer
        format: "JPEG", // Output format: JPEG or PNG
        quality: 0.1, // Quality from 0 (worst) to 1 (best)
      });
    }
    // Check if file is already smaller than MAX_FILE_SIZE
    if (file.size > MAX_FILE_SIZE) {
      let quality = 80;
      // Compress iteratively until file is under MAX_FILE_SIZE or quality is too low
      while (buffer.length > MAX_FILE_SIZE && quality > 10) {
        buffer = await sharp(buffer).jpeg({ quality }).toBuffer();
        quality -= 10; // Decrease quality incrementally
      }
      // Compress Second time
      // if (buffer.length > MAX_FILE_SIZE) {
      //   quality = 80;
      //   while (buffer.length > MAX_FILE_SIZE && quality > 10) {
      //     buffer = await sharp(buffer).jpeg({ quality }).toBuffer();
      //     quality -= 10; // Decrease quality incrementally
      //   }
      // }
    } else {
      buffer = await sharp(buffer).jpeg({ quality: 100 }).toBuffer();
    }
    // Save the compressed image
    fs.writeFileSync(imagePath, buffer);
    // Delete the original file from the server
    deleteSingleFile(file.path);
    return { imagePath, imageName };
  } catch (error) {
    // Log and reject with an error
    throw new Error("File compression failed.");
  }
};

export { deleteSingleFile, deleteMultiFile, compressImageFile };

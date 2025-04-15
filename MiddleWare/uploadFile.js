import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only Image.", false);
  }
};

const imagePDFFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else if (file.mimetype.startsWith("application/pdf")) {
    cb(null, true);
  } else {
    cb("Please upload only Image or PDF.", false);
  }
};

const pDFFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("application/pdf")) {
    cb(null, true);
  } else {
    cb("Please upload only PDF.", false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(`${__dirname}/../Resource`));
  },
  filename: (req, file, callback) => {
    var filename = `${Date.now()}-${file.originalname}`;
    callback(null, filename);
  },
});

const limits = {
  fileSize: 1.5 * 1024 * 1024, // 1.5 MB in bytes
};

// Only Image
const uploadImage = multer({ storage, limits, fileFilter: imageFilter });
// Image and PDF
const uploadImageAndPDF = multer({
  storage,
  limits,
  fileFilter: imagePDFFilter,
});
// Only PDF
const uploadPDF = multer({ storage, fileFilter: pDFFilter });

export { uploadImage, uploadImageAndPDF, uploadPDF };

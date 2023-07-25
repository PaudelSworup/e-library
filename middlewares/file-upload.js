const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let fileDestination = "";
    if (file.fieldname === "image") {
      fileDestination = "public/uploads/";
    } else if (file.fieldname === "pdf") {
      fileDestination = "public/pdfs/";
    }

    // check if directory exist
    if (!fs.existsSync(fileDestination)) {
      fs.mkdirSync(fileDestination, { recursive: true });
      cb(null, fileDestination);
    } else cb(null, fileDestination);
  },
  filename: (req, file, cb) => {
    let filename = path.basename(
      file.originalname,
      path.extname(file.originalname)
    );
    // abc.jpg
    // .jpg
    // final result abc

    let ext = path.extname(file.originalname); //.jpg (extension)
    cb(null, filename + "_" + Date.now() + ext);
  },
});

let imageFilter = (req, file, cb) => {
  if (
    !file.originalname.match(/\.(jpg|jpeg|png|svg|jgif|JPG|JPEG|PNG|SVG|JGIF)$/)
  ) {
    return cb(new Error("you can upload image file only"), false);
  } else cb(null, true);
};

const pdfFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(pdf)$/i)) {
    return cb(new Error("You can upload PDF files only"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.size > 5 * 1024 * 1024) {
      return cb(new Error("File size exceeds the allowed limit (5MB)"), false);
    }
    if (file.mimetype.includes("image")) {
      imageFilter(req, file, cb);
    } else if (file.mimetype === "application/pdf") {
      pdfFilter(req, file, cb);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
  limits: {
    fileSize: 5000000, //2MB
  },
});

module.exports = upload;

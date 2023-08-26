const Profile = require("../../models/Profile/profileModel");
const Books = require("../../models/books/booksModel");
const fs = require("fs");

exports.uploadProfile = async (req, res) => {
  let profile = await Profile.findOne({ userId: req.body.userid });

  if (!profile) {
    profile = new Profile({
      profileImage: req.file.path,
      userId: req.body.userid,
    });
    profile = await profile.save();
  }

  if (profile.profileImage) {
    fs.unlink(profile.profileImage, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log("Image deleted successfully");
      }
    });
  }

  profile.profileImage = req.file.path;
  profile = await profile.save();

  if (!profile) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  return res.status(200).json({ success: true, message: "profile Updated" });
};

exports.getProfile = async (req, res) => {
  let profile = await Profile.find().populate(
    "userId",
    "fullname choosedCatgoeirs address email mobilenum "
  );

  if (!profile) {
    return res.status(400).json({
      success: false,
      error: "Something went Wrong",
    });
  }

  return res.status(200).send({
    success: true,
    profile,
  });
};

exports.downloadBook = async (req, res) => {
  const book = await Books.findById(req.params.bookId);
  if (!book) {
    res.status(404).send({ success: false, error: "Book not found" });
  }
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${book?.title}.pdf`
  );
  res.setHeader("Content-Type", "application/pdf");
  const filetoDownload = book.pdf;
  // const fileName = path.basename(filetoDownload)
  res.download(filetoDownload, `${book.title}.pdf`, (err) => {
    if (err) {
      return res
        .status(500)
        .send({ success: false, error: "Error downloading the file" });
    }
  });
};

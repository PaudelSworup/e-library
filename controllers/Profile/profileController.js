const Profile = require("../../models/Profile/profileModel");

exports.uploadProfile = async (req, res) => {
  let profile = await Profile.findOne({ userId: req.body.userid });

  if (!profile) {
    profile = new Profile({
      profileImage: req.file.path,
      userId: req.body.userid,
    });
  } else {
    profile.profileImage = req.file.path;
  }

  profile = await profile.save();

  if (!profile) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  return res.status(200).json({ success: true, message: "profile Updated" });
};

exports.getProfile = async (req, res) => {
  let profile = await Profile.find().populate("userId", "fullname");

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

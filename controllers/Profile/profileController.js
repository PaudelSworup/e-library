const Profile = require("../../models/Profile/profileModel");
const path = require("path")

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
  let profile = await Profile.find().populate("userId", "fullname choosedCatgoeirs address email mobilenum ");

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

const filetoDownload = "public/pdfs/java_1689956384342.pdf"

exports.downloadProfile  = async(req,res)=>{
const fileName = path.basename(filetoDownload)
res.download(filetoDownload,fileName,(err)=>{
  if(err){
    return res.status(500).send({success:false, error:"Error downloading the file"})
  }
})

}

const reconizeDevice = require("../../models/DeviceReconization/detectDevice");
const otpModel = require("../../models/otpModel");
const readerModel = require("../../models/reader/readerModel");

exports.validateOTP = async (req, res) => {
  const userAgents = req.headers["user-agent"];
  const { width, height } = req.body;
 

  const attributes = [userAgents, width, height].join("|");
  const findUser = await readerModel.findOne({email:req.body.email.toLowerCase()});
  
  const otpFinder = await otpModel.findOne({ userId:findUser._id });

  if (!otpFinder) {
    return res.status(400).json({
      success: false,
      error: "sorry, unable to find your otp",
    });
  }

  if (otpFinder.expiresIn < Date.now()) {
    res.status(401).json({
      success: false,
      error: "OTP had expired",
    });
    return await otpModel.findOneAndDelete({
      userId: req.params.userId,
    });
  }

  await reconizeDevice.findOneAndUpdate(
    { userId: findUser._id },
    { $addToSet: { userAgents: attributes } },
    { upsert: true }
  );

  return res.status(200).json({ success: true,message:"OTP is validated" });
};

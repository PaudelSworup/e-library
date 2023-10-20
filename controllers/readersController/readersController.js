const Readers = require("../../models/reader/readerModel");
const Token = require("../../models/tokenModel");
const crypto = require("crypto");
const { addMinutes } = require("date-fns");
const sendEmail = require("../../utils/sendMail");
const generateToken = require("../../utils/generateToken");
const ReconizeDevice = require("../../models/DeviceReconization/detectDevice");
const uaParser = require("ua-parser-js");
const otpModel = require("../../models/otpModel");

exports.postUser = async (req, res) => {
  const userAgents = req.headers["user-agent"];
  const { width, height } = req.body;
  const attributes = [userAgents, width, height].join("|");
  let reader = new Readers({
    fullname: req.body.fullname,
    email: req.body.email.toLowerCase(),
    address: req.body.address,
    mobilenum: Number(req.body.mobilenum),
    password: req.body.password,
    choosedCatgoeirs: req.body.choosedCatgoeirs,
  });

  reader = await reader.save();

  if (!reader) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  let token = new Token({
    token: crypto.randomBytes(16).toString("hex"),
    userId: reader._id,
    expiresIn: addMinutes(Date.now(), 1440),
  });
  token = await token.save();
  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  let reconizeDevice = new ReconizeDevice({
    userId: reader._id,
    userAgents: attributes,
  });

  reconizeDevice = await reconizeDevice.save();

  const emailVerificationUrl = `${process.env.CLIENT_SIDE}/confirmation/${token.token}`;
  sendEmail({
    from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
    to: reader.email,
    subject: "User Registration",
    text: `hello ${reader.fullname}, \n\n your account has been created.\n please verify your email to continue`,
    html: `<p>Please verify your email to continue by clicking below link</p>
    <br>
    <a href="${emailVerificationUrl}"><button>Verify your email</button></a>`,
  });
  return res.status(200).json({
    success: true,
    message: "User has been created, Check your email to Activate your Account",
  });
};

// edit and update the details
exports.updateUserDetails = async (req, res) => {
  const { name, email, phone, address } = req.body;
  let user = await Readers.findOne({ _id: req.params.id });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, error: "unable to find the user" });
  } else {
    user.fullname = name;
    user.email = email;
    user.mobilenum = phone;
    user.address = address;
    user = await user.save();
    if (!user) {
      return res
        .status(500)
        .json({ success: false, error: "error in Editing your details" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Successfully changed your details" });
  }
};

// confirming the email
exports.postEmailVerification = async (req, res) => {
  const token = await Token.findOne({ token: req.params.token });

  // check for valid token
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  // check if token is expired or not
  if (token.expiresIn < Date.now()) {
    return res.status(401).json({
      success: false,
      error: "Token had expired",
    });
  }

  // if token is valid then find the user for that token
  let reader = await Readers.findOne({ _id: token.userId });
  if (!reader) {
    return res.status(401).json({
      success: false,
      error: "User not found",
    });
  }

  if (reader.isVerified) {
    return res
      .status(400)
      .json({ success: false, error: "user is already verified" });
  } else {
    reader.isVerified = true;

    reader = await reader.save();
  }

  if (!reader) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }
  return res.status(200).json({
    success: true,
    message: `Congratulation ${reader.fullname}, your account has been successfully activated.`,
  });
};

exports.resendVerification = async (req, res) => {
  let email = await Readers.findOne({ email: req.body.email.toLowerCase() });

  if (!email) {
    return res.status(400).json({
      success: false,
      error:
        "Provided email is not registered yet, Please register your account first",
    });
  }

  if (email.isVerified) {
    return res.status(400).json({
      success: false,
      error: "Email is already verified",
    });
  }

  let token = new Token({
    token: crypto.randomBytes(16).toString("hex"),
    userId: email._id,
    expiresIn: addMinutes(Date.now(), 1440),
  });

  token = await token.save();

  if (!token) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  const emailVerificationUrl = `${process.env.CLIENT_SIDE}/confirmation/${token.token}`;
  sendEmail({
    from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
    to: email.email,
    subject: "User Registration",
    text: `hello ${email.fullname}, click your verificatinn link to continue`,
    html: `<p>Please verify your email to continue by clicking below link</p>
    <br>
    <button><a href=${emailVerificationUrl}>verify email</a></button>`,
  });
  return res.send({
    success: true,
    message: "Verification link has been sent",
  });
};

// for login
exports.signIn = async (req, res) => {
  const userAgents = req.headers["user-agent"];

  const parser = new uaParser();
  const result = parser.setUA(userAgents).getResult();

  const { email, password, width, height } = req.body;
  const attributes = [userAgents, width, height].join("|");

  const user = await Readers.findOne({ email: email.toLowerCase() });

  // const clientIp = await getIp();

  if (!user) {
    return res.status(401).json({
      success: false,
      error:
        "this email is not registered yet, please register your account first",
    });
  }

  // if email found then check password for that email
  if (!user.authenticate(password)) {
    return res.status(401).json({ success: false, error: "Wrong credential" });
  }

  // check if user is verified
  if (!user.isVerified) {
    return res
      .status(400)
      .json({ success: false, error: "verify your email to continue" });
  }

  // now generate jwt
  const token = generateToken(user._id);
  res.cookie("token", token, { expire: Date.now() + 99999 });

  const storedDevice = await ReconizeDevice.findOne({ userId: user._id });

  if (!storedDevice) {
    let reconizeDevice = new ReconizeDevice({
      userId: user._id,
      userAgents: attributes,
    });

    reconizeDevice = await reconizeDevice.save();
  }

  if (storedDevice && storedDevice.userAgents.includes(attributes)) {
    const { _id, fullname, role, address, mobilenum, choosedCatgoeirs } = user;
    return res.json({
      success: true,
      token,
      user: {
        _id,
        fullname,
        role,
        email,
        address,
        choosedCatgoeirs,
        mobilenum,
      },
    });
  } else {
    // const location = await getLocation(clientIp);
    let otp = new otpModel({
      userId: user._id,
      otp: Math.floor(1000 + Math.random() * 9000),
      expiresIn: addMinutes(Date.now(), 10),
    });

    otp = await otp.save();

    sendEmail({
      from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
      to: user.email,
      subject: "Did you just Login to your account?",
      html: `
      
    <p>hey ${user.fullname}!<p>
    <p> A sign in attemp requires further verification beacuse we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.</p>
    <br/>

    <p>Device:${result.browser.name} on ${result.os.name} </p>
    <p>verification code:${otp.otp} </p>
    <br/>

    <p>If you did not attemp to sign in to your account, your password may be compromised. create a new strong password for your account </p>
    

    `,
    });

    return res.status(401).json({ success: false, newDevice: true });
  }
};

exports.getUser = async (req, res) => {
  const user = await Readers.find()
    .select("-createdAt")
    .select("-updatedAt")
    .select("-salt")
    .select("-hased_password");

  if (!user) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  return res.status(200).json({
    success: true,
    user,
  });
};

// forgot Password
exports.forgotPassword = async (req, res) => {
  const user = await Readers.findOne({ email: req.body.email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "Provided email is not found",
    });
  }

  let token = new Token({
    token: crypto.randomBytes(16).toString("hex"),
    userId: user._id,
    expiresIn: addMinutes(Date.now(), 5),
  });

  token = await token.save();

  if (!token) {
    return res.status(400).json({
      status: false,
      error: "Something went wrong",
    });
  }

  if (token.expiresIn < Date.now()) {
    return res.status(400).json({
      status: false,
      error: "Token has expired",
    });
  }

  const resetPassword = `${process.env.CLIENT_SIDE}/api/resetpassword/${token.token}`;

  sendEmail({
    from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
    to: user.email,
    subject: "Password Reset",
    text: `hello ${user.fullname}, click your verificatinn link to continue`,
    html: `<p>Reset your password by clicking below link</p>
    <br>
    <a href="${resetPassword}"><button>Reset Your Password</button></a>`,
  });

  res
    .status(200)
    .json({ success: true, message: "forgot password link has been sent" });
};

// reset password
exports.resetPassword = async (req, res) => {
  let token = await Token.findOne({ token: req.params.token });

  if (!token) {
    return res.status(401).json({ success: false, error: "Invalid Token" });
  }

  if (token.expiresIn < Date.now()) {
    return res.status(400).json({
      status: false,
      error: "Token has expired",
    });
  }
  let user = await Readers.findOne({ _id: token.userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "unable to find the user for valid token",
    });
  }

  user.hased_password = user.encryptPassword(req.body.password);
  user = await user.save();

  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Failed to reset password" });
  }
  return res
    .status(200)
    .json({ success: true, message: "Password has been reset successfully" });
};

// change password
exports.changePassword = async (req, res) => {
  const { password, new_password, repeat_password } = req.body;
  let user = await Readers.findOne({ _id: req.params.id });

  if (!user) {
    return res
      .status(404)
      .json({ success: false, error: "user do not exist in our system" });
  }

  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      error: "verify your accout to change the password",
    });
  }

  let verify_password = await Readers.findOne({
    hased_password: user.encryptPassword(password),
  });
  if (!verify_password) {
    return res
      .status(403)
      .json({ success: false, error: "your current password didn't match " });
  } else {
    if (new_password === repeat_password) {
      user.hased_password = user.encryptPassword(new_password);
      user = await user.save();

      if (!user) {
        return res
          .status(400)
          .json({ success: false, error: "Something went wrong" });
      }
      return res
        .status(200)
        .json({ success: true, message: "password has been changed" });
    } else {
      return res.status(400).json({
        success: false,
        error: "your new password and repeat password didn't match",
      });
    }
  }
};

exports.deleteUsers = (req, res) => {
  Readers.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (!user) {
        return res
          .status(403)
          .json({ success: false, error: "user not found" });
      } else
        return res
          .status(200)
          .json({ success: true, message: "user has been Removed" });
    })
    .catch((err) => {
      return res.status(400).json({ error: err });
    });
};

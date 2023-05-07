const Readers = require("../../models/reader/readerModel");
const Token = require("../../models/tokenModel");
const crypto = require("crypto");
const { addMinutes } = require("date-fns");
const sendEmail = require("../../utils/sendMail");
const generateToken = require("../../utils/generateToken");

exports.postUser = async (req, res) => {
  let reader = new Readers({
    fullname: req.body.fullname,
    email: req.body.email,
    address: req.body.address,
    mobilenum: Number(req.body.mobilenum),
    password: req.body.password,
    choosedCatgoeirs:req.body.choosedCatgoeirs
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

  const emailVerificationUrl = `${process.env.CLIENTSIDE}confirmation/${token.token}`;
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
    message: "User has been created, Check your email to verify your Account",
  });
};

// confirming the email

exports.postEmailVerification = async (req, res) => {
  const token = await Token.findOne({ token: req.params.token });

  // check for valid token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid token or Token may have expired",
    });
  }

  // check if token is expired or not
  if (token.expiresIn < Date.now()) {
    return res.status(401).json({
      success: false,
      message: "Token had expired",
    });
  }

  // if token is valid then find the user for that token
  let reader = await Readers.findOne({ _id: token.userId });
  if (!reader) {
    return res.status(401).json({
      success: false,
      message: "User not found",
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
    message: `Congrats ${reader.fullname}, your email has been verified`,
  });
};

exports.resendVerification = async (req, res) => {
  let email = await Readers.findOne({ email: req.body.email });

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

  const emailVerificationUrl = `${process.env.CLIENTSIDE}confirmation/${token.token}`;
  sendEmail({
    from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
    to: email.email,
    subject: "User Registration",
    text: `hello ${email.fullname}, click your verificatinn link to continue`,
    html: `<p>Please verify your email to continue by clicking below link</p>
    <br>
    <a href="${emailVerificationUrl}"><button>Verify your Email</button></a>`,
  });
  return res.send({
    success: true,
    message: "Verification link has been sent",
  });
};



exports.signIn = async(req,res)=>{
  const{email,password} = req.body
  const user = await Readers.findOne({email})

  if (!user) {
    return res.status(401).json({
      success:false,
      error:
        "this email is not registered yet, please register your account first",
    });
  }

  // if email found then check password for that email
  if (!user.authenticate(password)) {
    return res.status(401).json({ success:false, error: "Wrong credential" });
  }


  // check if user is verified
  if (!user.isVerified) {
    return res.status(400).json({ success:false, error: "verify your email to continue" });
  }


  // now generate jwt
  const token = generateToken(user._id)

  res.cookie("token", token , {expire:Date.now() + 99999} )

  const { _id, fullname, role,address , mobilenum , choosedCatgoeirs } = user;
  return res.json({
    success:true,
    token,
    user: {
      _id,
      fullname,
      role,
      email,
      address,
      choosedCatgoeirs,
      mobilenum
    },
  });
}

exports.getUser = async (req, res) => {
  const user = await Readers.find()
    .select("-createdAt")
    .select("-updatedAt")
    .select("-salt")
    .select("-hased_password")
    .select("-role");

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
  const user = await Readers.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "Provided email is not found please try again later",
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

  if(token.expiresIn < Date.now()){
    return res.status(400).json({
      status: false,
      error: "Token has expired",
    });
  }

  const resetPassword = `${process.env.CLIENTSIDE}api/resetpassword/${token.token}`;
  sendEmail({
    from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
    to: email.email,
    subject: "Password Reset",
    text: `hello ${email.fullname}, click your verificatinn link to continue`,
    html: `<p>PReset your password by clicking below link</p>
    <br>
    <a href="${resetPassword}"><button>Reset Your Password</button></a>`,
  });

  res.status(200).json({success:true, message: "forgot password link has been sent" });
};

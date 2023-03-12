const mongoose = require("mongoose");
const uuidv1 = require("uuidv1");
const crypto = require("crypto");

const readerSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    mobilenum: {
      type: Number,
      required: true,
    },

    hased_password: {
      type: String,
      required: true,
    },

    salt: String,

    role: {
      type: Number,
      default: 0,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// virtual fields
readerSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv1();
    this.hased_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password
  });


//   defining methods
readerSchema.methods = {
    encryptPassword: function(password){
        if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  authenticate: function (plaintext) {
    return this.encryptPassword(plaintext) === this.hased_password;
  },
}


module.exports = mongoose.model("Readers", readerSchema);

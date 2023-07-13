const { check, validationResult } = require("express-validator");

const Books = require("../models/books/booksModel");
const User = require("../models/reader/readerModel");

// books validation
exports.booksValidation = [
  check("title", "Please enter Book name")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage(" books name must be at least six characters")
    .custom((val) => {
      return Books.findOne({ title: val }).then((title) => {
        if (title) {
          return Promise.reject("Book name already exist");
        }
      });
    }),
  check("isbn", "please enter books isbn")
    .notEmpty()
    .isLength({ max: 10 })
    .withMessage("please enter 10 digits isbn of books")
    .custom((val) => {
      return Books.findOne({ isbn: val }).then((num) => {
        if (num) {
          return Promise.reject("isbn with same num already exist");
        }
      });
    }),
  check("stock", "Enter the stock quantity").notEmpty(),
  check("desc", "please enter some book description").notEmpty(),
  check("price", "please enter book price").notEmpty(),
  check("publisher", "please enter publisher name").notEmpty(),
  check("category", "please choose books category").notEmpty(),
  check(
    "yearofpublication",
    "please enter year of publication date"
  ).notEmpty(),
];

// user validation
exports.readersValidation = [
  check("fullname", "Please enter your fullname").notEmpty(),
  check("email", "Please enter your email")
    .notEmpty()
    .isEmail()
    .withMessage("Invalid email format")
    .custom((val) => {
      return User.findOne({ email: val.toLowerCase() }).then((user) => {
        if (user) {
          return Promise.reject("Another user with same email already exist");
        }
      });
    }),
  check("address", "please enter your address")
    .isLength({ min: 5 })
    .withMessage("enter the specfied address"),
  check("mobilenum", "please enter your mobile number")
    .isLength({ max: 10, min: 10 })
    .withMessage("enter 10 digits number")
    .custom((val) => {
      return User.findOne({ mobilenum: val }).then((user) => {
        if (user) {
          return Promise.reject(
            "Another user with same mobile number already exist"
          );
        }
      });
    }),

  check("password", "password is required")
    .notEmpty()
    .matches(/[a-z]/)
    .withMessage("password must contain one lowercase alphabet")
    .matches(/[A-Z]/)
    .withMessage("password must contain one uppercase alphabet")
    .matches(/[0-9]/)
    .withMessage("password must contain one numeric value")
    .matches(/[@$#-_/*&]/)
    .withMessage("password must contain one special character")
    .isLength({ min: 8 })
    .withMessage("password must be atleast 8 character")
    .isLength({ max: 50 })
    .withMessage("password can't be more than 50 character"),
  check("choosedCatgoeirs", "please choose the categories").notEmpty(),
];

// Login Validation
exports.loginValidation = [
  check("email", "Please enter your email")
    .notEmpty()
    .isEmail()
    .withMessage("Invalid email format"),
  check("password", "password is required").notEmpty(),
];

//forgot password validation
exports.forgotValidation = [
  check("email", "Please enter your email")
    .notEmpty()
    .isEmail()
    .withMessage("Invalid email format"),

]

// book issue request
exports.issueRequestValidation = [
  check("books_id", "Books has not been selected").notEmpty(),
  check("user_id", "user id is required").notEmpty(),
  // check("isssueDate", "please choose todays date").notEmpty()
];

exports.validators = (req, res, next) => {
  const error = validationResult(req);
  if (error.isEmpty()) {
    next();
  } else {
    return res.status(400).json({ error: error.array()[0].msg });
  }
};

const Books = require("../../models/books/booksModel");
const savedBookModel = require("../../models/books/savedBookModel");
const Users = require("../../models/reader/readerModel");
const sendEmail = require("../../utils/sendMail");
const fs = require("fs");
const Notification = require("../../models/notification/notificationModel");
const path = require("path");
const schedule = require("node-schedule");

exports.postBooks = async (req, res) => {
  let users = await Users.find({ role: 0 });

  // return console.log(req.body);
  let books = new Books({
    title: req.body.title,
    isbn: Number(req.body.isbn),
    price: req.body.price,
    category: req.body.category,
    stock: req.body.stock,
    image: req.files.image[0].path,
    pdf: req.files.pdf[0].path,
    desc: req.body.desc,
    publisher: req.body.publisher,
    yearofpublication: req.body.yearofpublication,
  });

  books = await books.save();

  if (!books) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  // let imagePath = books.image;

  users.map(async (users) => {
    let notification = new Notification({
      book: books._id,
      user: users._id,
      date: Date.now(),
      messageNotification: `New Book :${books?.title} added`,
      sendAll: true,
    });
    notification = await notification.save();
  });
  // users.forEach((user) => {
  //   fs.readFile(imagePath, (error, data) => {
  //     if (error) {
  //       console.log("error reading file", error);
  //       return;
  //     }

  //     const attachments = {
  //       filename: path.basename(imagePath),
  //       content: data,
  //       cid: "image@cid",
  //     };

  //     const emailContent = `<p>Hello, ${user.fullname}</p>
  //         <p>${req.body.title} book has been added to the Library.</p>
  //         <p><img src="cid:image@cid" alt="Book Image" /></p>`;

  //     sendEmail({
  //       from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
  //       to: user.email,
  //       subject: "New Book Added",
  //       html: emailContent,
  //       attachments,
  //     });
  //   });
  // });

  return res
    .status(200)
    .json({ success: true, message: "Books has been added" });
};

exports.getBooks = async (req, res) => {
  let books = await Books.find().populate("category", "category_name");

  if (!books) {
    return res.status(400).json({
      success: false,
      error: "Something went Wrong",
    });
  }

  return res.status(200).send({
    success: true,
    books: books.sort(() => Math.random() - 0.5),
  });
};

exports.getSingleBook = async (req, res) => {
  let books = await Books.find({ _id: req.params.id }).populate(
    "category",
    "category_name"
  );
  if (!books) {
    return res.status(400).json({
      success: false,
      error: "Something went Wrong",
    });
  }

  return res.status(200).send({
    success: true,
    books,
  });
};

exports.getBookByCategory = async (req, res) => {
  let books = await Books.find({ category: req.params.category })
    .populate("category", "category_name")
    .select("-createdAt")
    .select("-updatedAt");

  if (!books) {
    return res.status(400).json({
      success: false,
      error: "Something went Wrong",
    });
  }

  return res.status(200).send({
    success: true,
    books,
  });
};

exports.addBookmark = async (req, res) => {
  let books = new savedBookModel({
    userId: req.body.userId,
    book: req.body.book,
  });

  books = await books.save();

  if (!books) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Book has been added to your wishlist" });
};

exports.getBookmark = async (req, res) => {
  let books = await savedBookModel.find().populate({
    path: "book",
    select: "title category image isbn desc stock yearofpublication",
    populate: { path: "category", select: "category_name" },
  });
  if (!books) {
    return res.status(400).json({
      success: false,
      error: "Something went Wrong",
    });
  }

  return res.status(200).send({
    success: true,
    books,
  });
};

exports.removeBookmark = async (req, res) => {
  let bookMarkedBook = await savedBookModel.findOne({
    userId: req.params.userId,
    book: req.params.bookId,
  });
  savedBookModel
    .findByIdAndRemove(bookMarkedBook?._id)
    .then((book) => {
      if (!book) {
        return res
          .status(403)
          .json({ success: false, error: "Books not found" });
      } else
        return res.status(200).json({
          success: true,
          message: "Book has been removed from your wishlist",
        });
    })
    .catch((err) => {
      return res.status(400).json({ error: err });
    });
};

exports.deleteBooks = (req, res) => {
  Books.findByIdAndRemove(req.params.id)
    .then((book) => {
      if (!book) {
        return res
          .status(403)
          .json({ success: false, error: "Books not found" });
      } else
        return res
          .status(200)
          .json({ success: true, message: "Books has been Removed" });
    })
    .catch((err) => {
      return res.status(400).json({ error: err });
    });
};

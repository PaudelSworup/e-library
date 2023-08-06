const Books = require("../../models/books/booksModel");
const notificationModel = require("../../models/notification/notificationModel");
const Users = require("../../models/reader/readerModel");
const sendEmail = require("../../utils/sendMail");
const fs = require("fs");
const path = require("path");

exports.postBooks = async (req, res) => {
  // console.log(req.files.pdf[0].path)
  fs.stat(req.files.pdf[0].path, (err, stats) => {
    if (err) {
      console.error("Error while getting file size:", err);
      return res
        .status(500)
        .json({ success: false, error: "Error while getting file size" });
    }
    const fileSizeInBytes = stats.size;
    if (fileSizeInBytes > 5 * 1024 * 1024) {
      fs.unlink(req.files.image[0].path, (err) => {
        if (err) {
          console.log("Error while deleting the file:", err);
        }
        console.log("Uploaded image deleted due to size limit exceeded");
      });
    }
  });
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

  let imagePath = books.image;

  let users = await Users.find();
  users.forEach((user) => {
    fs.readFile(imagePath, (error, data) => {
      if (error) {
        console.log("error reading file", error);
        return;
      }

      const attachments = {
        filename: path.basename(imagePath),
        content: data,
        cid: "image@cid",
      };

      const emailContent = `<p>Hello, ${user.fullname}</p>
          <p>${req.body.title} book has been added to the Library.</p>
          <p><img src="cid:image@cid" alt="Book Image" /></p>`;

      sendEmail({
        from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
        to: user.email,
        subject: "New Book Added",
        html: emailContent,
        attachments,
      });
    });
  });

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

// exports.getAllBooks = async (req, res) => {
//   let books = await Books.find()
//     // .populate("category", "category_name")

//   if (!books) {
//     return res.status(400).json({
//       success: false,
//       error: "Something went Wrong",
//     });
//   }

//   const recentlyAdded = books.map((data)=>{
//     return {...data, timestamps:new Date(data.createdAt).getTime()}
//   })

//   recentlyAdded.sort((a,b)=>b.timestamps - a.timestamps)

//   const recent = recentlyAdded.slice(0,3)
//   console.log(recent)

//   return res.status(200).send({
//     success: true,
//     recent,
//   });
// };

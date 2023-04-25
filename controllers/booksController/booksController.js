const Books = require("../../models/books/booksModel");

exports.postBooks = async (req, res) => {
  console.log(req.file.path);
  let books = new Books({
    title: req.body.title,
    isbn: Number(req.body.isbn),
    price: req.body.price,
    category: req.body.category,
    stock: req.body.stock,
    image: req.file.path,
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

  return res
    .status(200)
    .json({ success: true, message: "Books has been added" });
};

exports.getBooks = async (req, res) => {
  let books = await Books.find()
    .populate("category", "category_name")

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

exports.getSingleBook = async(req,res)=>{
  let books = await Books.find({_id:req.params.id})
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
}

exports.getBookByCategory = async (req, res) => {
  let books = await Books.find({ category: req.params.category }).populate(
    "category",
    "category_name"
  ).select("-createdAt").select("-updatedAt")

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



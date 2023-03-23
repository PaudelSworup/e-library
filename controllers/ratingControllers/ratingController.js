const Ratings = require("../../models/ratings/ratingModel");
const Books = require("../../models/books/booksModel")
const natural = require("natural")

exports.provideRating = async (req, res) => {
  let alreadyRated = await Ratings.findOne({
    book: req.body.book,
    user: req.body.user,
  });

  if (alreadyRated) {
    return res.status(400).json({
      success: false,
      error: "Review/Ratings has been recorded previously",
    });
  }
  let bookRating = new Ratings({
    rating: Number(req.body.rating),
    book: req.body.book,
    user: req.body.user,
  });

  bookRating = await bookRating.save();

  if (!bookRating) {
    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  res.status(200).send({
    success: true,
    message: "your ratings was recorded",
  });
};

exports.getratingsDetails = async (req, res) => {
  let details = await Ratings.find()
    .populate("book", "title , image , isbn")
    .populate("user", "fullname , email");

    console.log(details.ratings)

    if(!details){
      res.status(400).json({
        success: false,
        error: "Something went wrong",
      });
    }
    return res.status(200).send({
      success:true,
      details
    })
};

exports.recommendedBooks = async(req,res)=>{
const data = await Ratings.find().populate("book" , "title image isbn desc")

// create a matrix of user ratings
const matrix = data.reduce((matrix, { user, book, rating }) => {
  if (!matrix[user]) matrix[user] = {};
  matrix[user][book] = rating;
  return matrix;
}, {});

// calculate the similarities between books
const bookSimilarities = {};
Object.keys(matrix).forEach((user) => {
  Object.keys(matrix[user]).forEach((book1) => {
    Object.keys(matrix[user]).forEach((book2) => {
      if (book1 === book2) return;
      if (bookSimilarities[book1] && bookSimilarities[book1][book2]) return;
      if (!bookSimilarities[book1]) bookSimilarities[book1] = {};
      const numerator = Object.keys(matrix).reduce((sum, otherUser) => {
        if (matrix[otherUser][book1] && matrix[otherUser][book2]) {
          sum += matrix[otherUser][book1] * matrix[otherUser][book2];
        }
        return sum;
      }, 0);
      const denominator = Object.keys(matrix).reduce((sum, otherUser) => {
        if (matrix[otherUser][book1] && matrix[otherUser][book2]) {
          sum +=
            Math.pow(matrix[otherUser][book1], 2) *
            Math.pow(matrix[otherUser][book2], 2);
        }
        return sum;
      }, 0);
      bookSimilarities[book1][book2] = numerator / Math.sqrt(denominator);
    });
  });
});

// generate recommendations for a given user
const recommend = (user) => {
  const userRatings = matrix[user];
  const bookScores = {};
  Object.keys(userRatings).forEach((book1) => {
    Object.keys(bookSimilarities[book1]).forEach((book2) => {
      if (userRatings[book2]) return;
      if (!bookScores[book2]) bookScores[book2] = 0;
      bookScores[book2] += bookSimilarities[book1][book2] * userRatings[book1];
    });
  });
  const recommendations = Object.keys(bookScores).sort(
    (a, b) => bookScores[b] - bookScores[a]
  );
  return res.status(200).json({
    success:true,
    recommendations
  })
};

recommend(req.params.id); 
}


exports.recommendByCategory = async(req,res)=>{
  // Train the classifier with sample books and their genres
  let books = await Books.find()
    .populate("category", "category_name")
    .select("-createdAt")
    .select("-updatedAt");
  
  
  const classifier = new natural.BayesClassifier();
  for (const item of books){
    classifier.addDocument(item.desc , item.category.category_name)
  }
  classifier.train();

  const userInput = ["Animation", "Fantasy" ,"Mathematics" , "Science"]
  

  const recommendedBooks = [];
  userInput.forEach((input) => {
    // recommendedBooks.length = 0;
    const classification = classifier.classify(input);

    const relatedBooks = books.filter((book) => book.category.category_name === classification);
    // const relatedBooks = data.filter((book) => book.category=== classification)

    if (relatedBooks.length > 0) {
      console.log(`Here are some ${classification} books you might like:`);
      relatedBooks.forEach((book) => {
        console.log(book.title);
        console.log(book.desc);
        recommendedBooks.push(book);
      });
    } else {
      console.log("Sorry, we don't have any recommendations for that category.");
    }
  });

  if (recommendedBooks.length > 0) {
    res.status(200).send({
      success:true,
      recommendedBooks
    })
  } else {
    res.status(404).send({
      success:false,
      error:"No books found related to your category"
    });
  }
};

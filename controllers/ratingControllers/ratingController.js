const Ratings = require("../../models/ratings/ratingModel");

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
  return recommendations;
};

console.log(recommend(req.params.id)); // Output: [ 'The Great Gatsby' ]


}

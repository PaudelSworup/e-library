const Ratings = require("../../models/ratings/ratingModel");
const Books = require("../../models/books/booksModel");
const Readers = require("../../models/reader/readerModel");
const natural = require("natural");

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

  console.log(details.ratings);

  if (!details) {
    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }
  return res.status(200).send({
    success: true,
    details,
  });
};

exports.recommendedBooks = async (req, res) => {
  const data = await Ratings.find().populate(
    "book",
    "title image isbn desc stock"
  );

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
        bookScores[book2] +=
          bookSimilarities[book1][book2] * userRatings[book1];
      });
    });
    const recommendations = Object.keys(bookScores).sort(
      (a, b) => bookScores[b] - bookScores[a]
    );

    // console.log(recommendations)
    const idRegex = /_id:\s*new\s+ObjectId\("(\w+)"\)/;
    const titleRegex = /title:\s*'([^']*)'/;
    const descRegex = /desc:\s*'([^']*)'/;
    const isbnRegex = /isbn:\s*(\d+)/;
    const stockRegex = /stock:\s*(\d+)/;
    const imageRegex = /image:\s*'([^']*)'/;

    let newRecommendations = [];
    recommendations.forEach((book) => {
      const idMatch = book.match(idRegex)
      const titleMatch = book.match(titleRegex);
      const descMatch = book.match(descRegex);
      const isbnMatch = book.match(isbnRegex);
      const stockMatch = book.match(stockRegex);
      const imageMatch = book.match(imageRegex);

      if (titleMatch && descMatch) {
        const title = titleMatch[1];
        const desc = descMatch[1];
        const isbn = isbnMatch[1];
        const stock = stockMatch[1];
        const image = imageMatch[1];
        const _id = idMatch[1]
        newRecommendations.push({ _id, title, desc, isbn, stock, image });
      }
    });

    return newRecommendations;
  };

  const recommendations = recommend(req.params.id);
  return res.status(200).json({
    success: true,
    recommendations,
  });
};

exports.recommendByCategory = async (req, res) => {
  // Train the classifier with sample books and their genres
  let books = await Books.find()
    .populate("category", "category_name")
    .select("-createdAt")
    .select("-updatedAt");

  const classifier = new natural.BayesClassifier();
  for (const item of books) {
    classifier.addDocument(item.desc, item.category.category_name);
  }
  classifier.train();

  let myInput = await Readers.find({ _id: req.params.id }).select(
    "choosedCatgoeirs"
  );

  if (!myInput) {
    res.status(403).json({
      success: false,
      error: "Something went wrong",
    });
  }

  //  const userInput = ["Animation", "Fantasy" ,"Mathematics" , "Science"]
  const userInput = myInput.map((data) => data.choosedCatgoeirs).flat();

  const recommendedBooks = [];
  const seen = new Set();

  userInput.forEach((input) => {
    // recommendedBooks.length = 0;
    const classification = classifier.classify(input);

    const relatedBooks = books.filter(
      (book) => book.category.category_name === classification
    );
    // const relatedBooks = data.filter((book) => book.category=== classification)

    if (relatedBooks.length > 0) {
      console.log(`Here are some ${classification} books you might like:`);
      relatedBooks.forEach((book) => {
        if (!seen.has(book._id)) {
          seen.add(book._id);
          recommendedBooks.push(book);
        }
      });
    } else {
      console.log(
        "Sorry, we don't have any recommendations for that category."
      );
    }
  });

  if (recommendedBooks.length > 0) {
    res.status(200).send({
      success: true,
      recommendedBooks,
    });
  } else {
    res.status(404).send({
      success: false,
      error: "No books found related to your category",
    });
  }
};

exports.browse = async (req, res) => {
  const binarySearch = (books, searchTerm) => {
    let left = 0;
    let right = books.length - 1;
    const results = [];

    // Linear search to find all books that match the search term
    books.forEach((book) => {
      if (book.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push(book);
      }
    });

    // Binary search to find the index of the first book that matches the search term
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const title = books[mid].title.toLowerCase();

      if (searchTerm.toLowerCase() === title.substring(0, searchTerm.length)) {
        // Found a book that matches the search term - add it to the results array
        results.push(books[mid]);

        // Check if there are any more matching books to the left of this one
        for (let i = mid - 1; i >= left; i--) {
          const title = books[i].title.toLowerCase();
          if (title.includes(searchTerm.toLowerCase())) {
            results.push(books[i]);
          } else {
            break;
          }
        }

        // Check if there are any more matching books to the right of this one
        for (let i = mid + 1; i <= right; i++) {
          const title = books[i].title.toLowerCase();
          if (title.includes(searchTerm.toLowerCase())) {
            results.push(books[i]);
          } else {
            break;
          }
        }

        // Done searching
        break;
      } else if (searchTerm.toLowerCase() < title) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // Remove duplicates from the results array
    const uniqueResults = results.filter(
      (book, index, self) =>
        index === self.findIndex((b) => b.title === book.title)
    );

    return res.status(200).send({ success: true, uniqueResults });
  };

  // Example usage:
  const books = await Books.find()
    .populate("category", "category_name")
    .select("-createdAt")
    .select("-updatedAt");

  console.log(books);

  binarySearch(books, req.params.name);
};


exports.listBooks = async(req,res)=>{
  let single_book = await Books.findById(req.params.id)
  let limit = req.query.limit ? parseInt(req.params.limit) : 6
  let book = await Books.find({_id:{$ne:single_book}, category:single_book.category}).limit(limit).populate("category", "category_name")
  if(!book){
    return res.status(400).json({ success:false, error: "something went wrong" });
  }
  return res.status(200).json({success:true , book})
}

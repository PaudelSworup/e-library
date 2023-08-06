const Ratings = require("../../models/ratings/ratingModel");
const Books = require("../../models/books/booksModel");
const Readers = require("../../models/reader/readerModel");
const natural = require("natural");

exports.provideRating = async (req, res) => {
  console.log(req.body.book);
  console.log(req.body.user);
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

  res.cookie("userID", req.body.user, { httpOnly: true });
  return res.status(200).send({
    success: true,
    message: "your ratings was recorded",
  });
};

exports.getratingsDetails = async (req, res) => {
  let details = await Ratings.find()
    .populate("book", "title , image , isbn")
    .populate("user", "fullname , email");

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

exports.getSingle = async (req, res) => {
  let books = await Ratings.find({ book: req.params.bookId }).populate(
    "book",
    "title , image , isbn"
  );
  if (!books) {
    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }
  return res.status(200).send({
    success: true,
    books,
  });
};

exports.recommendedBooks = async (req, res) => {
  const data = await Ratings.find().populate(
    "book",
    "title image isbn desc stock yearofpublication"
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
    if (!userRatings) {
      return []; // or handle the case when userRatings is not available
    }

    const bookScores = {};
    Object.keys(userRatings).forEach((book1) => {
      if (!bookSimilarities[book1]) {
        return; // Skip if there are no similarities calculated for book1
      }

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


    const idRegex = /_id:\s*new\s+ObjectId\("(\w+)"\)/;
    const titleRegex = /title:\s*'([^']*)'/;
    const descRegex = /desc:\s*'([^']*)'/;
    const isbnRegex = /isbn:\s*(\d+)/;
    const stockRegex = /stock:\s*(\d+)/;
    const imageRegex = /image:\s*'([^']*)'/;
    const yopRegex = /yearofpublication: ([\d-]+T[\d:.]+Z)/;

    let newRecommendations = [];
    recommendations.forEach((book) => {
      const idMatch = book.match(idRegex);
      const titleMatch = book.match(titleRegex);
      const descMatch = book.match(descRegex);
      const isbnMatch = book.match(isbnRegex);
      const stockMatch = book.match(stockRegex);
      const imageMatch = book.match(imageRegex);
      const yearMatch = book.match(yopRegex);

      if (titleMatch && descMatch) {
        const title = titleMatch[1];
        const desc = descMatch[1];
        const isbn = isbnMatch[1];
        const stock = stockMatch[1];
        const image = imageMatch[1];
        const _id = idMatch[1];
        const yearofpublication = yearMatch[1];
        newRecommendations.push({
          _id,
          title,
          desc,
          isbn,
          stock,
          image,
          yearofpublication,
        });
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
    const classification = classifier.classify(input);

    const relatedBooks = books.filter(
      (book) => book.category.category_name === classification
    );
    // const relatedBooks = data.filter((book) => book.category=== classification)

    if (relatedBooks.length > 0) {
      relatedBooks.forEach((book) => {
        if (!seen.has(book._id)) {
          seen.add(book._id);
          recommendedBooks.push(book);
        }
      });
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
  const binarySearch = (books, keyword) => {
    let left = 0;
    let right = books.length - 1;
    const matches = [];

    while (left <= right) {
      let mid = Math.floor((left + right) / 2);
      let book = books[mid];
      if (book.title.toLowerCase().includes(keyword.toLowerCase())) {
        matches.push(book);
      }

      if (book.title.toLowerCase().localeCompare(keyword.toLowerCase()) < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (matches.length === 0) {
      books.forEach((book) => {
        if (book.title.toLowerCase().includes(keyword.toLowerCase())) {
          matches.push(book);
        }
      });
    } else {
      console.log(`Books containing "${keyword}":`);
      matches.forEach((book) => {
        matches.push(book);
      });
    }

    // Remove duplicates from the results array
    const uniqueResults = matches.filter(
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

  binarySearch(books, req.params.name);
};

exports.listBooks = async (req, res) => {
  let single_book = await Books.findById(req.params.id);
  let limit = req.query.limit ? parseInt(req.params.limit) : 6;
  let book = await Books.find({
    _id: { $ne: single_book },
    category: single_book.category,
  })
    .limit(limit)
    .populate("category", "category_name");
  if (!book) {
    return res
      .status(400)
      .json({ success: false, error: "something went wrong" });
  }
  return res.status(200).json({ success: true, book });
};

exports.getKnn = async (req, res) => {
  console.log(req.params.userid);
  console.log(req.params.bookid);
  const books = await Books.find().populate("category", "category_name");

  const userRatings = await Ratings.find();

  const getSingleRatings = await Ratings.findOne({
    book: req.params.bookid,
    user: req.params.userid,
  });

  // Calculate Euclidean distance between two users
  function calculateDistance(userA, userB) {
    return Math.sqrt(Math.pow(userA.rating - userB.rating, 2));
  }

  // Find k nearest neighbors to the target user
  function findNearestNeighbors(targetUser, users, k) {
    const distances = [];
    for (const user of users) {
      const distance = calculateDistance(targetUser, user);
      distances.push({ user, distance });
    }
    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, k).map((item) => item.user);
  }

  // Generate book recommendations based on nearest neighbors
  function generateRecommendations(neighbors) {
    const bookRecommendations = [];

    for (const book of books) {
      let totalRating = 0;
      let count = 0;

      for (const neighbor of neighbors) {
        const rating = userRatings.find(
          (rating) =>
            rating.user.toString() === neighbor.user.toString() &&
            rating.book.toString() === book._id.toString()
        );
        if (rating) {
          totalRating += rating.rating;
          count++;
        }
      }

      if (count > 0) {
        const averageRating = totalRating / count;
        bookRecommendations.push({ book, averageRating });
      }
    }

    bookRecommendations.sort((a, b) => b.averageRating - a.averageRating);

    return bookRecommendations;
  }

  // Example usage

  if (getSingleRatings) {
    const targetUser = {
      user: req.params.userid,
      _id: req.params.bookid,
      rating: getSingleRatings.rating,
    };
    const k = 3;
    const nearestNeighbors = findNearestNeighbors(targetUser, userRatings, k);
    const recommendations = generateRecommendations(nearestNeighbors);
    return res.status(200).send({ success: true, recommendations });
  }
};

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

  const books = await Books.find().populate("category", "category_name");

  const userRatings = await Ratings.find();

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
  const targetUser = {
    user: req.body.user,
    _id: req.body.book,
    rating: Number(req.body.rating),
  };
  const k = 3;
  const nearestNeighbors = findNearestNeighbors(targetUser, userRatings, k);
  const recommendations = generateRecommendations(nearestNeighbors);

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
    recommendations,
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

  if (data.length <= 2) {
    return;
  }

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


      

    // const recommendations = Object.keys(bookScores)
    // .filter((book) => userRatings[book] === undefined && userRatings[book] > 4)
    // .sort((a, b) => bookScores[b] - bookScores[a]);

    // console.log(recommendations)
    const idRegex = /_id:\s*new\s+ObjectId\("(\w+)"\)/;
    const titleRegex = /title:\s*'([^']*)'/;
    const descRegex = /desc:\s*'([^']*)'/;
    const isbnRegex = /isbn:\s*(\d+)/;
    const stockRegex = /stock:\s*(\d+)/;
    const imageRegex = /image:\s*'([^']*)'/;
    const yopRegex = /yearofpublication: ([\d-]+T[\d:.]+Z)/;;

    let newRecommendations = [];
    recommendations.forEach((book) => {
      const idMatch = book.match(idRegex);
      const titleMatch = book.match(titleRegex);
      const descMatch = book.match(descRegex);
      const isbnMatch = book.match(isbnRegex);
      const stockMatch = book.match(stockRegex);
      const imageMatch = book.match(imageRegex);
      const yearMatch = book.match(yopRegex)

      if (titleMatch && descMatch) {
        const title = titleMatch[1];
        const desc = descMatch[1];
        const isbn = isbnMatch[1];
        const stock = stockMatch[1];
        const image = imageMatch[1];
        const _id = idMatch[1];
        const yearofpublication = yearMatch[1]
        newRecommendations.push({ _id, title, desc, isbn, stock, image, yearofpublication });
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

// exports.getKnnRecommendation = async (req, res) => {
//   // const books = await Books.find().select("-createdAt").select("-updatedAt");

//   // const userRatings = await Ratings.find().populate("user", "fullname");

//   // console.log(userRatings);

//   const books = [
//     {
//       _id: new ObjectId("64187ba2c15bc509780768f9"),
//       title: "Lord of the Rings",
//       isbn: 802149287,
//       price: 13.49,
//       category: new ObjectId("641879e3664581677d3a24b7"),
//       publisher: "Allen & Unwin",
//       desc: 'The Lord of the Rings" is a fantasy novel written by J.R.R. Tolkien. It was first published in 1954 and has since become one of the most popular and beloved works of fiction in the world. The story is set in a fictional world called Middle-earth and follows the journey of a hobbit named Frodo Baggins, who is entrusted with the task of destroying a powerful and malevolent ring that could bring darkness and destruction to the world. ',
//       stock: 10,
//       image: "public/uploads/lor_1679326113899.jpg",

//       __v: 0,
//     },
//     {
//       _id: new ObjectId("64187dbf4035d463c7572008"),
//       title: "harry potter and philosopher stone ",
//       isbn: 802149283,
//       price: 13.49,
//       category: new ObjectId("641879e3664581677d3a24b7"),
//       publisher: "Bloomsbury Publishing",
//       desc: `Harry Potter and the Philosopher's Stone" is the first novel in the Harry Potter series, written by J.K. Rowling. It was first published in 1997 and became an instant classic, spawning a hugely successful book and film franchise. The story follows the adventures of Harry Potter, an orphaned boy who discovers that he is a wizard and is invited to attend Hogwarts School of Witchcraft and Wizardry. Along with his new friends Ron Weasley and Hermione Granger, Harry embarks on a series of magical adventures while also discovering the truth about his parents' mysterious deaths. The book is a captivating tale of magic, friendship, and adventure, with themes of love, loyalty, and the triumph of good over evil.`,
//       stock: 10,
//       image: "public/uploads/hp_1679326655511.jpg",

//       __v: 0,
//     },
//     {
//       _id: new ObjectId("64187e895b8ebedbd13c2f5b"),
//       title: "Avatar the last Airbender",
//       isbn: 802149281,
//       price: 12.4,
//       category: new ObjectId("63e3ca8412bafef1e7bc8ccd"),
//       publisher: "Dark Horse",
//       desc: 'Avatar: The Last Airbender" is an American animated television series created by Michael Dante DiMartino and Bryan Konietzko. It aired on Nickelodeon from 2005 to 2008 and has since become a beloved classic among fans of animated shows. The story is set in a world where certain people have the ability to "bend" or manipulate one of the four elements - water, earth, fire, and air. The series follows a young boy named Aang, who is the last surviving Airbender and the Avatar - a being who has the power to control all four elements and maintain balance in the world. Aang, along with his friends Katara, Sokka, and later on, Toph and Zuko, goes on a quest to defeat the Fire Nation and bring peace to the world.',
//       stock: 20,
//       image: "public/uploads/avatar_1676530387954.png",

//       __v: 0,
//     },
//     {
//       _id: new ObjectId("641c7b2447d0c592ebd44bc2"),
//       title: "Operational Research",
//       isbn: 812149282,
//       price: 13.5,
//       category: new ObjectId("641b1c41d91dd81f8228f823"),
//       publisher: "Springer",
//       desc: "Operational research (OR), also known as operations research, is a scientific approach to solving complex problems related to the optimization of systems and processes. It involves using advanced analytical and mathematical techniques to help organizations make better decisions and improve their performance. OR techniques can be applied to a wide range of fields, including logistics, manufacturing, transportation, healthcare, and finance, among others.",
//       stock: 20,
//       image: "public/uploads/or_1679588131880.jpg",

//       __v: 0,
//     },
//     {
//       _id: new ObjectId("641c7d55af37c4e9c9419057"),
//       title: "The Elegant Universe",
//       isbn: 812149283,
//       price: 13.5,
//       category: new ObjectId("641b1d1bd91dd81f8228f829"),
//       publisher: "Heritage Publishers",
//       desc: 'The Elegant Universe" is popular science book written by physicist Brian Greene, first published in 1999. It explores the concept of string theory, a theoretical framework that seeks to reconcile the laws of quantum mechanics and general relativity. The book delves into the complexities of string theory, which suggests that the fundamental building blocks of the universe are not particles, but tiny, vibrating strings of energy.',
//       stock: 20,
//       image: "public/uploads/eu_1679588692857.jpeg",

//       __v: 0,
//     },
//     {
//       _id: new ObjectId("641dd2bc2f8b203903c96461"),
//       title: "Advance Java",
//       isbn: 812239280,
//       price: 13.5,
//       category: new ObjectId("641b1c4ed91dd81f8228f825"),
//       publisher: "Manning Publications",
//       desc: "Advanced Java is an extension of the core Java programming language and is used to develop complex and advanced applications for enterprise-level use. It includes a wide range of advanced features and technologies, including server-side programming, web development, and database connectivity. Some of the key features of Advanced Java include Servlets, JSP (JavaServer Pages), JDBC (Java Database Connectivity), JPA (Java Persistence API), and EJB (Enterprise JavaBeans).",
//       stock: 20,
//       image: "public/uploads/ajp_1679676091993.jpg",

//       __v: 0,
//     },
//     {
//       _id: new ObjectId("6443fbf675f9f4b9a4ae7823"),
//       title:
//         "JavaScript: JavaScript Programming Made Easy for Beginners & Intermediates",
//       isbn: 1951737237,
//       price: 7.5,
//       category: new ObjectId("641b1c4ed91dd81f8228f825"),
//       publisher: "Antony Mwau",
//       desc: "JavaScript is a high-level, dynamic, and interpreted programming language that is widely used in web development. It was created in the mid-1990s by Brendan Eich, and has since become one of the most popular programming languages in the world. JavaScript is primarily used to add interactivity and dynamic functionality to websites and web applications. It can be used for everything from simple form validation and user interface enhancements to more complex applications such as real-time web games and data visualizations.",
//       stock: 20,
//       image: "public/uploads/js_1682177014075.jpg",

//       __v: 0,
//     },
//   ];

//   const userRatings = [
//     {
//       _id: new ObjectId("643c027f2e06a855b244f948"),
//       rating: 5,
//       book: new ObjectId("64187ba2c15bc509780768f9"),
//       user: {
//         _id: new ObjectId("641dc61a922e371e855635e2"),
//         fullname: "Yushika Sigdel",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c02c92e06a855b244f94b"),
//       rating: 4,
//       book: new ObjectId("64187dbf4035d463c7572008"),
//       user: {
//         _id: new ObjectId("641dc61a922e371e855635e2"),
//         fullname: "Yushika Sigdel",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c02e82e06a855b244f94e"),
//       rating: 5,
//       book: new ObjectId("64187dbf4035d463c7572008"),
//       user: {
//         _id: new ObjectId("641dc56c922e371e855635d7"),
//         fullname: "Sworup Khatri",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c03072e06a855b244f951"),
//       rating: 5,
//       book: new ObjectId("641dd2bc2f8b203903c96461"),
//       user: {
//         _id: new ObjectId("641dc56c922e371e855635d7"),
//         fullname: "Sworup Khatri",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c03302e06a855b244f954"),
//       rating: 5,
//       book: new ObjectId("641c7b2447d0c592ebd44bc2"),
//       user: {
//         _id: new ObjectId("641dc3d2922e371e855635cc"),
//         fullname: "Cristiano Ronaldo",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c03552e06a855b244f957"),
//       rating: 5,
//       book: new ObjectId("641c7d55af37c4e9c9419057"),
//       user: {
//         _id: new ObjectId("641dc3d2922e371e855635cc"),
//         fullname: "Cristiano Ronaldo",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c03c52e06a855b244f960"),
//       rating: 5,
//       book: new ObjectId("64187e895b8ebedbd13c2f5b"),
//       user: {
//         _id: new ObjectId("641dc3d2922e371e855635cc"),
//         fullname: "Cristiano Ronaldo",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("643c05252e06a855b244f969"),
//       rating: 5,
//       book: new ObjectId("641c7b2447d0c592ebd44bc2"),
//       user: {
//         _id: new ObjectId("641dc56c922e371e855635d7"),
//         fullname: "Sworup Khatri",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("645cc10271af1cf82b984639"),
//       rating: 4,
//       book: new ObjectId("641dd2bc2f8b203903c96461"),
//       user: {
//         _id: new ObjectId("641dc3d2922e371e855635cc"),
//         fullname: "Cristiano Ronaldo",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("64664a8b7948c8240d42a197"),
//       rating: 4,
//       book: new ObjectId("64187ba2c15bc509780768f9"),
//       user: {
//         _id: new ObjectId("641dc56c922e371e855635d7"),
//         fullname: "Sworup Khatri",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("646a4e73fe0c077e479262c8"),
//       rating: 4,
//       book: new ObjectId("6443fbf675f9f4b9a4ae7823"),
//       user: {
//         _id: new ObjectId("641dc56c922e371e855635d7"),
//         fullname: "Sworup Khatri",
//       },
//       __v: 0,
//     },
//     {
//       _id: new ObjectId("646a4efdb4c0e76c434552de"),
//       rating: 3,
//       book: new ObjectId("64187ba2c15bc509780768f9"),
//       user: {
//         _id: new ObjectId("641dc3d2922e371e855635cc"),
//         fullname: "Cristiano Ronaldo",
//       },
//       __v: 0,
//     },
//   ];

//   // return res.status(200).send({books , userRatings})

//   //   let details = await Ratings.find()
//   //   .populate("book", "title , image , isbn")
//   //   .populate("user", "fullname , email");

//   // let books = await Books.find()
//   //   .populate("category", "category_name")
//   //   .select("-createdAt")
//   //   .select("-updatedAt");

//   function calculateDistance(userA, userB) {
//     return Math.sqrt(Math.pow(userA.rating - userB.rating, 2));
//   }

//   function findNearestNeighbors(targetUser, users, k) {
//     const distances = [];
//     for (const user of users) {
//       // console.log("tu" , targetUser , "user is" , user)
//       const distance = calculateDistance(targetUser, user);
//       distances.push({ user, distance });
//       // console.log("distance" , distance)
//     }
//     distances.sort((a, b) => a.distance - b.distance);

//     return distances.slice(0, k).map((item) => item.user);
//   }

//   function generateRecommendations(neighbors) {
//     const bookRecommendations = [];
//     for (const book of books) {
//       let totalRating = 0;
//       let count = 0;

//       for (const neighbor of neighbors) {
//         const rating = details.find((rating) => {
//           // console.log("rating is" , rating)
//           // console.log("neigh" , neighbor)
//           return (
//             rating?.user?._id === neighbor?.user?._id &&
//             rating?.book?._id === book?._id
//           );
//         });

//         if (rating) {
//           totalRating += rating.rating;
//           count++;
//         }
//       }

//       if (count > 0) {
//         const averageRating = totalRating / count;
//         bookRecommendations.push({ book, averageRating });
//       }
//     }
//     bookRecommendations.sort((a, b) => b.averageRating - a.averageRating);

//     return bookRecommendations;
//   }

//   const targetUser = {
//     // userId: req.body.user,
//     // bookId: req.body.book,
//     // rating: Number(req.body.rating),
//     user: "641dc3d2922e371e855635cc",
//     bookId: "64187ba2c15bc509780768f9",
//     rating: 4,
//   };
//   const k = 3;
//   const nearestNeighbors = findNearestNeighbors(targetUser, details, k);
//   // console.log("near", nearestNeighbors);
//   const recommendations = generateRecommendations(nearestNeighbors);
//   res.status(200).send(recommendations);

//   // const bookss = await Books.find()
//   // console.log(bookss)

//   // const data = await Ratings.find().populate(
//   //   "book",
//   //   "title "
//   // );
//   // console.log(data)
// };

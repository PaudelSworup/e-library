const Reports = require("../../models/reports/reportsModel");
const Readers = require("../../models/reader/readerModel");
const { addDays, startOfDay, endOfDay } = require("date-fns");
const Books = require("../../models/books/booksModel");
const sendEmail = require("../../utils/sendMail");
const schedule = require("node-schedule");
const Notification = require("../../models/notification/notificationModel");

// to issue request
exports.issueRequest = async (req, res) => {
  let request = new Reports({
    books_id: req.body.books_id,
    user_id: req.body.user_id,
    issueDate: Date.now(),
    // returnDate: addDays(new Date(req.body.issueDate), 10),
  });

  
  let issuedBooks = await Reports.findOne({
    user_id: req.body.user_id,
    books_id: req.body.books_id,
    returnStatus: 0,
  });


  const currentDate = new Date();
  const startOfCurrentDay = startOfDay(currentDate)
  const endOfCurrentDay = endOfDay(currentDate);


  const userRequestToday = await Reports.find({
    user_id: req.body.user_id,
    issueDate: {
      $gte: startOfCurrentDay,
      $lt: endOfCurrentDay,
    }, 
  })

  if (userRequestToday.length >= 3) {
    return res.status(403).json({
      success: false,
      error:
        "You cannot make more than three request in a day.",
    });
  }

  

  if (issuedBooks) {
    let bookName = await Books.findOne({ _id: req.body.books_id });
    return res.status(403).json({
      success: false,
      error: `you already have issued ${bookName.title}`,
    });
  }

  request = await request.save();

  if (!request) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  return res.status(200).send({
    success: true,
    message: "Book request has been sent",
  });
};

// to get all the data (specially for admin)
exports.getIssueRequest = async (req, res) => {
  const request = await Reports.find()
    .select("-createdAt")
    .select("-updatedAt")
    .populate("user_id", "fullname")
    .populate("books_id", "title image");

  if (!request) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  return res.status(200).send({
    success: true,
    request,
  });
};

// to get only item of a user
exports.getUserRequest = async (req, res) => {
  let single = await Reports.find({ user_id: req.params.id }).populate(
    "user_id",
    "fullname"
  );

  // console.log(single.length);
  console.log(single);

  if (!single) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong, Maybe your userId is not valid",
    });
  }

  return res.status(200).send({
    success: true,
    single,
  });
};

// approve request
exports.approveRequest = async (req, res) => {
  let approve = await Reports.findOne({
    user_id: req.params.id,
    issueStatus: 0,
  });

  // console.log(approve.book_num)
  let user = await Readers.findOne({
    _id: req.params.id,
  });

  if (approve) {
    if (approve.issueStatus == 0) {
      approve.issueStatus = 1;
      approve.approvedDate = Date.now();
    }
    approve = await approve.save();

    if (!approve) {
      return res.status(400).json({
        success: false,
        error: "Something went wrong",
      });
    }
    let bookName = await Books.findOne({ _id: approve.books_id });
    sendEmail({
      from: "KCTLIBRARY 📧 <kct.edu.gmail.com",
      to: user.email,
      subject: "Request Approved",
      text: `hello ${user.fullname}, \n your request for ${bookName.title} has been approved`,
    });

    let notification = new Notification({
      book: approve.books_id,
      user: req.params.id,
      date:Date.now()
    });
    notification = await notification.save();
    if (notification) {
      return res.status(200).json({
        success: true,
        message: "Your request has been approved",
      });
    }
  }

  return res.status(400).json({
    success: false,
    error: "Already Approved ",
  });
};

// reject request
exports.rejectRequest = async (req, res) => {
  let status = await Reports.findOne({
    user_id: req.params.id,
    issueStatus: 0,
  });

  if (status) {
    if (status.issueStatus == 0) {
      status.issueStatus = 2;
      status.returnStatus = 2;
    }
    status = await status.save();

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Something went wrong",
      });
    }

    let readers = await Readers.findOne({ _id: req.params.id });

    let bookName = await Books.findOne({ _id: status.books_id });
    sendEmail({
      from: "KCTLIBRARY 📧 <kct.edu@gmail.com",
      to: readers.email,
      subject: "Rejected Request",
      text: `hello ${readers.fullname},\n Sorry, Your Request for ${bookName.title} has been rejected for some reason.\n Visit Library to know the cause`,
    });

    bookName.stock = bookName.stock + 1;
    bookName = await bookName.save();
    return res.status(200).json({
      success: true,
      message: "Your request has been Rejected",
    });
  }
};

// return books
exports.returnBooks = async (req, res) => {
  let returnedBooks = await Reports.find({
    user_id: req.body.user_id,
    books_id: req.body.books_id,
  });

  let returnBookList = returnedBooks.filter((data) => {
    return data.issueStatus == 1 && data.returnStatus == 0;
  });

  let book = await Books.findOne({ _id: req.body.books_id });
  returnBookList.map(async (data) => {
    if (data.issueStatus == 1 && data.returnStatus == 0) {
      data.userReturnedDate = Date.now();
      data = await data.save();
      if (data.returnDate < data.userReturnedDate) {
        let fine =
          (returnedBooks.userReturnedDate.getDate() -
            returnedBooks.returnDate.getDate()) *
          10;

        data.penalty = fine;
        data.returnStatus = 1;

        book.stock = book.stock + 1;
        data = await data.save();
        book = await book.save();
        if (!data) {
          return res.status(400).json({
            success: false,
            error: "Something went wrong",
          });
        } else {
          return res.status(200).json({
            success: true,
            message: `Books returned with fine of Rs.${fine}`,
          });
        }
      }
      data.returnStatus = 1;
      book.stock = book.stock + 1;
      data = await data.save();
      book = await book.save();
      return res.status(200).json({
        success: true,
        message: `Books returned`,
      });
    }
    return res.status(400).json({
      success: true,
      error: `Books has been already returned`,
    });
  });
};

exports.getHistory = async (req, res) => {
  let history = await Reports.find()
    .select("-createdAt")
    .select("-updatedAt")
    .populate("books_id", "title , image")
    .populate("user_id", "fullname");

  const filterData = history.filter((data) => {
    return (
      data.issueStatus == 1 || data.issueStatus == 2 || data.issueStatus == 0
    );
  });

  if (!filterData) {
    return res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }

  res.status(200).json({
    success: true,
    filterData,
  });
};

exports.getMostRequested = async (req, res) => {
  try {
    const reports = await Reports.find();

    // Count the requests for each book
    const requestCounts = new Map();
    for (const report of reports) {
      const bookId = report.books_id._id.toString();
      const count = requestCounts.get(bookId) || 0;
      requestCounts.set(bookId, count + 1);
    }

    // Find the books with the request count of 2 or more
    const mostRequestedBooks = [];
    for (const [bookId, count] of requestCounts) {
      if (count >= 2) {
        const book = await Books.findById(bookId);
        mostRequestedBooks.push(book);
      }
    }

    return res.status(200).send({ success: true, mostRequestedBooks });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to get the most requested books.",
    });
  }
};

exports.sendNotification = async (req, res) => {
  console.log(req.params.id);
  const dueDates = await Reports.find({
    issueStatus: 1,
    user_id: req.params.id,
  })
    .populate("user_id", "fullname email")
    .populate("books_id", "title , image");

  const notification = [];
  const jobPromises = []; // Array to store the job promises

  const notificationPromise = new Promise((resolve) => {
    dueDates.forEach((data) => {
      console.log(new Date(data.returnDate).toISOString());
      console.log(new Date(data.returnDate).toLocaleString());
      const startTime = new Date(new Date() + 1000);
      // const startTime = new Date(data.returnDate - 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 1000);

      const job = schedule.scheduleJob(
        { start: startTime, end: endTime, rule: "*/1 * * * * *" },
        function () {
          let notificationData = {
            message: `This is the reminder for you that your return date for ${data.books_id.title} is tomorrow`,
            books_id: data.books_id,
            user_id: req.params.id,
            date: new Date(),
          };

          notification.push(notificationData);
          console.log(notification);
          // resolve()
        }
      );

      if (job) {
        jobPromises.push(
          new Promise((resolve) => {
            job.on("run", resolve);
          })
        );
      }
    });

    // Resolve the notificationPromise when all job promises are resolved
    Promise.all(jobPromises).then(resolve);
  });

  await notificationPromise; // Wait for all notifications to be added

  return res.status(200).json({
    success: true,
    notification,
  });
};

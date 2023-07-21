const Notification = require("../../models/notification/notificationModel");
const schedule = require("node-schedule");

exports.sendNotifications = async (req, res) => {
  let notificationsData = await Notification.find({ user: req.params.id })
    .populate("user", "fullname email")
    .populate("book", "title image");

  const notification = [];
  const jobPromises = []; // Array to store the job promises

  const notificationPromise = new Promise((resolve) => {
    notificationsData.forEach((data) => {
      console.log(data)
      // console.log(new Date(data.returnDate).toISOString());
      // console.log(new Date(data.returnDate).toLocaleString());
      const startTime = new Date(new Date() + 1000);
      // const startTime = new Date(data.returnDate - 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 1000);

      const job = schedule.scheduleJob(
        { start: startTime, end: endTime, rule: "*/1 * * * * *" },
        function () {
          let notificationData = {
            message: `Your request for: ${data.book.title} is approved.`,
            books_id: data.book,
            user_id: req.params.id,
            date: new Date(),
            status: data.notificationStatus,
          };

          notification.push(notificationData);
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

exports.updateStatus = async (req, res) => {
  let { newData } = req.body;
  try {
    for (let { id, user_id, message } of newData) {
      console.log(message);
      let notification = await Notification.findOne({
        book: id,
        user: user_id,
      });

      if (notification) {
        notification.notificationStatus = 1;
        notification.messageNotification = message;
        notification = await notification.save();
      }
    }

    let notification = await Notification.find({ user: req.params.id })
      .populate("user", "fullname email")
      .populate("book", "title image");
    return res.status(200).send({ success: true, notification });
  } catch (err) {
    console.log(err);
  }
};

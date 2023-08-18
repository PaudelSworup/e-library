const Notification = require("../../models/notification/notificationModel");
const schedule = require("node-schedule");

exports.sendNotifications = async (req, res) => {
  let notificationsData = await Notification.find({ user: req.params.id })
    .populate("user", "fullname email")
    .populate("book", "title image");

  const notification = [];
  const jobPromises = []; // Array to store the job promises

  const notificationPromise = new Promise((resolve) => {
    if (notificationsData) {
      notificationsData.forEach((data) => {
        const startTime = new Date(new Date() + 1000);
        const endTime = new Date(startTime.getTime() + 1000);

        const job = schedule.scheduleJob(
          { start: startTime, end: endTime, rule: "*/1 * * * * *" },
          function () {
            notification.push(data);
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
    }

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
  console.log(newData);
  try {
    const updatePromises = newData.map(async ({ id, user_id, message }) => {
      return Notification.updateMany(
        { book: id, user: user_id },
        {
          $set: {
            notificationStatus: 1,
            messageNotification: message,
          },
        }
      );
    });
    await Promise.all(updatePromises);
    const notifications = await Notification.find({ user: req.params.id })
      .populate("user", "fullname email")
      .populate("book", "title image");

    return res.status(200).send({ success: true, notification: notifications });
  } catch (err) {
    return res
      .status(500)
      .send({ success: false, error: "Internal server error" });
  }
  };

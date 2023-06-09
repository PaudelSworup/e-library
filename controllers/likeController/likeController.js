const Like = require("../../models/Like/LIkeModel");

exports.postLikes = async (req, res) => {
  const existingLike = await Like.findOne({
    book: req.body.book,
    user: req.body.user,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike?._id);
    return res.status(200).send({success:true , message:"Unliked"})
  }

  let likes = new Like({
    book: req.body.book,
    user: req.body.user,  
  });
  likes.likedStatus = 1;
  likes = await likes.save();

  if (!likes) {
    return res.status(400).send({
      success: false,
      error: "Something went wrong",
    });
  }

  return res.status(200).send({
    success: true,
    message: "Liked",
  });
};

exports.getLikes = async (req, res) => {
  let likes = await Like.find();
  if (!likes) {
    return res.status(400).send({
      success: false,
      error: "Something went wrong",
    });
  }

  const counts = await Like.aggregate([
    {
      $group: {
        _id: "$book",
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gte: 1 },
      },
    },
  ]);

  return res.status(200).send({
    success: true,
    likes,
    counts,
  });
};



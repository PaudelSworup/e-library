const Category = require("../../models/books/categoryModel");

// register category
exports.registerCatgory = async (req, res) => {
  let category = new Category({
    category_name: req.body.category_name,
  });

  category = await category.save();

  if (!category) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  res.json({ success: true, message: " Category is posted" });
};


// to get category
exports.getCategory = async(req,res)=>{
  let category = await Category.find()
  .select("-createdAt")
  .select("-updatedAt")

  if (!category) {
    return res
      .status(400)
      .json({ success: false, error: "Something went wrong" });
  }

  res.status(200).send({ success: true, category });
}

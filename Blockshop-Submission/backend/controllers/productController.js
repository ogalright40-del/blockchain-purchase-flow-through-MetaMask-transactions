const productService = require("../services/productService");

exports.getProducts = async (req, res) => {
  try {
    const data = await productService.getProducts(req.query);

    res.json({
      success: true,
      products: data.products,
      total: data.total
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
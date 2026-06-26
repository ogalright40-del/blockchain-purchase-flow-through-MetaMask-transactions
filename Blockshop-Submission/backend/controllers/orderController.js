const orderService = require("../services/orderService");

exports.getOrders = async (req, res) => {
  const orders = await orderService.getOrders();
  res.json({ orders });
};

exports.getOrder = async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  res.json(order);
};
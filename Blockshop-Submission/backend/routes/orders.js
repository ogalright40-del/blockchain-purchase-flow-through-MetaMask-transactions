const router = require("express").Router();
const orderController = require("../controllers/orderController");

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrder);

module.exports = router;
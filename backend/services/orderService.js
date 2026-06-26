let orders = [];

exports.createOrder = (data) => {
  const order = { id: Date.now(), ...data };
  orders.push(order);
  return order;
};

exports.getOrders = () => orders;

exports.getOrder = (id) => {
  return orders.find(o => o.id == id);
};
import React, { useEffect, useState } from "react";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => setOrders(data.orders));
  }, []);

  return (
    <div>
      <h2>My Orders</h2>
      {orders.map(o => (
        <div key={o.id}>
          Order #{o.id} - {o.status}
        </div>
      ))}
    </div>
  );
}
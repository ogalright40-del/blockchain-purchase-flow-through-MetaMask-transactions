import React, { useState } from "react";
import { buyProduct } from "../../services/blockchain";

export default function Checkout() {
  const [status, setStatus] = useState("");

  const handlePay = async () => {
    try {
      setStatus("Processing...");
      const tx = await buyProduct(1, "1000000000000000000"); // example
      await tx.wait();
      setStatus("Success");
    } catch (err) {
      setStatus("Failed");
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <button onClick={handlePay}>Pay with MetaMask</button>
      <p>{status}</p>
    </div>
  );
}
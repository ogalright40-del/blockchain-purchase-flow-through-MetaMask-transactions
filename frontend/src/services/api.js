const API_URL = "http://localhost:5001";

export const getProducts = async () => {
  const res = await fetch(`${API_URL}/api/products`);
  return res.json();
};
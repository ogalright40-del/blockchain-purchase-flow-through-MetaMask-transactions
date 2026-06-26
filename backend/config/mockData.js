// Mock data — plain strings for ETH values (no ethers dependency needed here)

const SELLER  = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const SELLER2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

// priceWei as plain strings (no ethers.parseEther needed at import time)
const ETH = (val) => (BigInt(Math.round(parseFloat(val) * 1e18))).toString();

const mockProducts = [
  { id:1,  seller:SELLER,  name:'MacBook Pro M3 16"',        description:'Apple M3 Pro chip, 18GB RAM, 512GB SSD. The ultimate professional laptop for creators and developers.',                 imageURI:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', category:'Electronics', priceWei:ETH('0.8'),   stock:10,  sold:42,   isActive:true, createdAt:1709000000, totalRating:235,  ratingCount:48  },
  { id:2,  seller:SELLER,  name:'Sony WH-1000XM5',           description:'Industry-leading noise canceling. 30-hour battery, Bluetooth 5.2, multipoint connection, crystal-clear calls.',          imageURI:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', category:'Electronics', priceWei:ETH('0.1'),   stock:25,  sold:187,  isActive:true, createdAt:1709100000, totalRating:890,  ratingCount:183 },
  { id:3,  seller:SELLER,  name:'iPhone 15 Pro Max',         description:'Titanium design, A17 Pro chip, 5x telephoto camera, USB 3 speeds. The most powerful iPhone ever made.',                imageURI:'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80', category:'Electronics', priceWei:ETH('0.4'),   stock:15,  sold:203,  isActive:true, createdAt:1709200000, totalRating:965,  ratingCount:198 },
  { id:4,  seller:SELLER2, name:'Nike Air Max 2024',          description:'Cushlon foam midsole, lightweight mesh upper, available in 12 colorways. Maximum cushioning for all-day comfort.',     imageURI:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', category:'Fashion',     priceWei:ETH('0.05'),  stock:50,  sold:892,  isActive:true, createdAt:1709300000, totalRating:4280, ratingCount:876 },
  { id:5,  seller:SELLER2, name:'Ergonomic Office Chair',     description:'Breathable mesh back, adjustable lumbar support, 4D armrests, 360 degree swivel. Designed for 8+ hour workdays.',     imageURI:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', category:'Furniture',   priceWei:ETH('0.15'),  stock:8,   sold:67,   isActive:true, createdAt:1709400000, totalRating:318,  ratingCount:65  },
  { id:6,  seller:SELLER,  name:'Apple Watch Series 9',      description:'S9 chip, Double Tap gesture, ECG app, Blood Oxygen sensor, crash detection, 18-hour battery, 45mm Always-On.',        imageURI:'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80', category:'Electronics', priceWei:ETH('0.13'),  stock:20,  sold:145,  isActive:true, createdAt:1709500000, totalRating:697,  ratingCount:143 },
  { id:7,  seller:SELLER2, name:'Luxury Skincare Set (5pc)', description:'Vitamin C serum, retinol night cream, SPF50 moisturizer, eye cream, micellar cleanser. Dermatologist tested.',         imageURI:'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', category:'Beauty',      priceWei:ETH('0.07'),  stock:45,  sold:328,  isActive:true, createdAt:1709600000, totalRating:1576, ratingCount:323 },
  { id:8,  seller:SELLER,  name:'Samsung 65" 4K OLED TV',   description:'4K OLED panel, 144Hz refresh, HDR10+, Dolby Atmos, 4x HDMI 2.1, Tizen smart OS. Pure cinematic experience.',           imageURI:'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80', category:'Electronics', priceWei:ETH('0.6'),   stock:5,   sold:23,   isActive:true, createdAt:1709700000, totalRating:109,  ratingCount:22  },
  { id:9,  seller:SELLER2, name:'Premium Yoga Mat',          description:'6mm thick natural rubber, alignment guide, non-slip texture, eco-friendly. 72 x 26 inches. Carry strap included.',     imageURI:'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80', category:'Sports',      priceWei:ETH('0.025'), stock:80,  sold:567,  isActive:true, createdAt:1709800000, totalRating:2720, ratingCount:558 },
  { id:10, seller:SELLER2, name:'JavaScript: The Good Parts',description:"Douglas Crockford's essential guide to JavaScript best practices. 172 pages, O'Reilly, the definitive reference.",   imageURI:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80', category:'Books',       priceWei:ETH('0.01'),  stock:200, sold:2341, isActive:true, createdAt:1709900000, totalRating:11205,ratingCount:2305},
];

const mockSellers = {
  [SELLER]:  { sellerAddress:SELLER,  name:'BlockShop Official', bio:'Official BlockShop store — verified products, fast shipping.', totalSales:703,  totalRevenue:ETH('28.5'),  joinedAt:1700000000, isVerified:true },
  [SELLER2]: { sellerAddress:SELLER2, name:'TechMart Pro',        bio:'Premium electronics and lifestyle products at crypto prices.',  totalSales:1884, totalRevenue:ETH('19.2'),  joinedAt:1700500000, isVerified:true },
};

const mockReviews = {
  1: [
    { reviewer:'0xAbCd...1234', productId:1, rating:5, comment:"Incredible machine. M3 Pro handles everything. Best laptop I've ever owned.", timestamp:1710000000 },
    { reviewer:'0xDeF0...5678', productId:1, rating:5, comment:'Paid in ETH — super smooth transaction. Arrived in perfect condition.',        timestamp:1710100000 },
    { reviewer:'0x1234...AbCd', productId:1, rating:4, comment:'Great performance but runs warm under heavy load. Still worth every wei.',      timestamp:1710200000 },
  ],
  2: [
    { reviewer:'0xAaAa...BbBb', productId:2, rating:5, comment:'Best headphones ever. Noise canceling is unreal. Blockchain payment was instant.', timestamp:1710050000 },
    { reviewer:'0xCcCc...DdDd', productId:2, rating:4, comment:'Sound quality is excellent. Slightly tight for big heads.',                         timestamp:1710150000 },
  ],
};

module.exports = { mockProducts, mockSellers, mockReviews, SELLER, SELLER2 };

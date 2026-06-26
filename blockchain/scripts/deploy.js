const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 BlockShop Deployment Script");
  console.log("================================");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy Token
  console.log("📦 Deploying BlockShopToken (BST)...");
  const Token = await ethers.getContractFactory("BlockShopToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("✅ BST Token:", tokenAddr);

  // 2. Deploy Marketplace
  console.log("\n📦 Deploying BlockShopMarketplace...");
  const Marketplace = await ethers.getContractFactory("BlockShopMarketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketAddr = await marketplace.getAddress();
  console.log("✅ Marketplace:", marketAddr);

  // 3. Link
  console.log("\n🔗 Linking Token → Marketplace...");
  await token.setMarketplace(marketAddr);
  console.log("✅ Linked");

  // 4. Seed demo data
  console.log("\n🌱 Seeding demo data...");
  await seed(marketplace, deployer);

  // 5. Save deployment artifacts
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      BlockShopMarketplace: { address: marketAddr },
      BlockShopToken: { address: tokenAddr, symbol: "BST", name: "BlockShop Token" }
    }
  };

  const dirs = [
    path.join(__dirname, "../../backend/config"),
    path.join(__dirname, "../../frontend/src/contracts")
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "deployment.json"), JSON.stringify(deployment, null, 2));
  }

  // Copy ABIs
  const abisDir = path.join(__dirname, "../../backend/config/abis");
  const frontAbisDir = path.join(__dirname, "../../frontend/src/contracts");
  fs.mkdirSync(abisDir, { recursive: true });
  fs.mkdirSync(frontAbisDir, { recursive: true });

  for (const name of ["BlockShopMarketplace", "BlockShopToken"]) {
    try {
      const art = JSON.parse(fs.readFileSync(
        path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`)
      ));
      fs.writeFileSync(path.join(abisDir, `${name}.json`), JSON.stringify(art.abi, null, 2));
      fs.writeFileSync(path.join(frontAbisDir, `${name}.json`), JSON.stringify(art.abi, null, 2));
    } catch (e) { console.warn("⚠️  Could not copy ABI for", name); }
  }

  console.log("\n🎉 DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════");
  console.log("Marketplace :", marketAddr);
  console.log("BST Token   :", tokenAddr);
  console.log("═══════════════════════════════════════");
}

async function seed(marketplace, deployer) {
  await marketplace.registerSeller("BlockShop Official", "The official BlockShop store");

  const products = [
    { n:"MacBook Pro M3 16\"",   d:"Apple M3 Pro, 18GB RAM, 512GB SSD. The ultimate pro laptop.", img:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", c:"Electronics", p:"0.8",  s:10 },
    { n:"Sony WH-1000XM5",        d:"Industry-leading noise canceling, 30hr battery, Bluetooth 5.2.", img:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", c:"Electronics", p:"0.1",  s:25 },
    { n:"iPhone 15 Pro Max",      d:"Titanium design, A17 Pro chip, 5x telephoto camera.", img:"https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600", c:"Electronics", p:"0.4",  s:15 },
    { n:"Nike Air Max 2024",      d:"Cushlon foam, lightweight mesh, available in 12 colors.", img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", c:"Fashion",     p:"0.05", s:50 },
    { n:"Ergonomic Office Chair", d:"Mesh back, lumbar support, adjustable arms, 5-year warranty.", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600", c:"Furniture",   p:"0.15", s:8  },
    { n:"Apple Watch Series 9",   d:"S9 chip, Double Tap, ECG, Blood Oxygen, 18hr battery.", img:"https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600", c:"Electronics", p:"0.13", s:20 },
    { n:"Luxury Skincare Set",    d:"Vitamin C serum, retinol, SPF50 moisturizer — 5 products.", img:"https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600", c:"Beauty",      p:"0.07", s:45 },
    { n:"Samsung 65\" OLED TV",   d:"4K OLED, 144Hz, HDR10+, Dolby Atmos, Tizen OS.", img:"https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600", c:"Electronics", p:"0.6",  s:5  },
    { n:"Premium Yoga Mat",       d:"6mm thick natural rubber, non-slip, eco-friendly, 72\" x 26\".", img:"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600", c:"Sports",      p:"0.025",s:80 },
    { n:"JavaScript: The Good Parts", d:"Douglas Crockford. The definitive JS reference — 172 pages.", img:"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600", c:"Books",       p:"0.01", s:200},
  ];

  for (const p of products) {
    await marketplace.listProduct(p.n, p.d, p.img, p.c, ethers.parseEther(p.p), p.s);
    process.stdout.write(`  ✅ ${p.n}\n`);
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; });

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const { initBlockchain } = require('./config/blockchain');

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/api/products',   require('./routes/products'));
app.use('/api/blockchain', require('./routes/blockchain'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'BlockShop API', time: new Date() }));
app.use('*', (req, res) => res.status(404).json({ success: false, message: `${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ success: false, message: err.message }));

const PORT = process.env.PORT || 5001;
async function start() {
  await initBlockchain();
  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║  🔗 BlockShop API  │  Port ${PORT}          ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);
  });
}
start();
module.exports = app;

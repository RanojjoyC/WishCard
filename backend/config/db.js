const mongoose = require('mongoose');
const dns = require('dns');

// On Windows or environments where local ISP DNS cannot resolve MongoDB Atlas SRV records,
// set reliable DNS resolvers (Cloudflare & Google)
if (process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb+srv')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if not supported
  }
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[Database Fatal] MONGO_URI is not set in environment. Exiting.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[Database] MongoDB Connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

require('dotenv').config();
const mongoose = require("mongoose");
const AddressModel = require("../AddressDb");

const mongoURI = process.env.MONGODB_URI;

// Define the migration logic
const runMigration = async () => {
  try {
    // Wait for MongoDB connection to be established
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
    }

    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once("connected", resolve);
        mongoose.connection.once("error", reject);
      }
    });

    // Define the addresses you want to add
    const defaultAddresses = {
      Bitcoin: "bitcon",
      Ethereum: "eth",
      Tether: "usdt",
      Tron: "tx",
      Dogecoin: "doge",
      Binance: "bnb",
    };

    // Use the create method to add the addresses to the collection
    const insertResult = await AddressModel.create(defaultAddresses);

    console.log("Migration completed successfully", insertResult);
    
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runMigration();

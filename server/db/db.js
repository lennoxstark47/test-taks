const mongoose = require("mongoose");

const db = async () => {
  try {
    return await mongoose.connect(process.env.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (e) {
    console.log(e);
  }
};
module.exports = db;

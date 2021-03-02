const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var daily = new Schema({
    _id: { type: String, require},
    userID:{type: String, require},
    score:{type: Number, require}
});

module.exports = mongoose.model("daily", daily);

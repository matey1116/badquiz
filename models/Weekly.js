const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var weekly = new Schema({
    _id: { type: String, require},
    userID:{type: String, require},
    score:{type: Number, require}
});

module.exports = mongoose.model("weekly", weekly);

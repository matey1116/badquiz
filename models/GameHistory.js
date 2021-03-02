const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var gameHistory = new Schema({
    _id: { type: String, require},
    userID:{type: String, require},
    gameID:{type: String, require},
    gameDate:{type: Number, require},
    points:{type: Number, require}
});

module.exports = mongoose.model("gameHistory", gameHistory);

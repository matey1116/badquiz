const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var history = new Schema({
    _id: { type: String, require},
    answers: {type: Schema.Types.Mixed, require},
    score:{type: Number, require}
});

module.exports = mongoose.model("history", history);

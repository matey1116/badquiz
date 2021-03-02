const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var account = new Schema({
    _id: {type:String, require},
    email: {type: String, require},
    password: {type: String, require},
    FName: {type: String, require},
    LName: {type: String, require},
    lastOnline: {type: Number, require},
});

module.exports = mongoose.model("accounts", account);

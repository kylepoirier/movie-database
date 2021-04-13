const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
	name: {
		type: String, 
		required: [true, "Missing username"],
		minlength: [1, "Username too short"],
		trim: true
	},
	password: {
        type: String,
        required: [true, "Missing password"],
        minlength: [8, "Password too short"]
    },
    type: {
        type: Boolean,
    },
    reviews: {
        type: Array
    },
    watchlist:
        [{ type: Schema.Types.ObjectId, ref: 'Movie' }]
    ,
    followers: {
        type: Array
    },
    following: {
        type: Array
    },
    followingPeople: {
        type: Array
    }
});

module.exports = mongoose.model("User", userSchema);

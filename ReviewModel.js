const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let reviewSchema = Schema({
	reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
	movie: { type: Schema.Types.ObjectId, ref: 'Movie' },
	score: {
		type: Number,
		min: 1,
		max: 10,
		required: checkReview
	},
	summary: {
		type: String,
		required: checkReview
	},
	review: {
		type: String,
		required: checkReview
	}
});

function checkReview(){
	return this.score || this.summary || this.review;
}

module.exports = mongoose.model("Review", reviewSchema);
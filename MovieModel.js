const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let movieSchema = Schema({
	Title: {type: String, required: true, minlength: 1, trim: true},
	Year: {type: String, required: true},
	Rated: {type: String, required: true},
	Released: {type: String, required: true},
	Runtime: {type: String, required: true},
	Genre: {type: Array, required: true},
	Director: {type: Array, required: true},
	Writer: {type: Array, required: true},
	Actors: {type: Array, required: true},
	Plot: {type: String, required: true},
	Awards: {type: String, required: true},
	Poster: {type: String, required: true},
	ID: {type: Number, required: false},
	Reviews: {type: Array, required: false}
});

module.exports = mongoose.model("Movie", movieSchema);
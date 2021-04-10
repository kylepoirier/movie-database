let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
let movieData = require("./movie-data-10.json");
let movies = [];
let nextID=0;
movieData.forEach(movie => {
	movie.ID = nextID;
	movies[nextID++] = movie;
});
let users = [{
    name: "admin", password: "password", type: true, reviews: [], watchlist: [], followers: [], following: [], followingActors: []
}];
let reviews = [];
let persons = [];

MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
	if (err) throw err;

	db = client.db('database');
	db.dropCollection("movies", function (err, result) {
		if (err) {
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
		} else {
			console.log("Cleared movie collection.");
		}
		db.collection("movies").insertMany(movies, function (err, result) {
			if (err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " movies.")
		})
	});
    db.dropCollection("users", function (err, result) {
		if (err) {
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
		} else {
			console.log("Cleared user collection.");
		}
        db.collection("users").insertMany(users, function (err, result) {
			if (err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " users.")
            
		})
	});
    db.dropCollection("reviews");
    db.createCollection("reviews");

    db.dropCollection("persons");
    db.createCollection("persons");
    
});

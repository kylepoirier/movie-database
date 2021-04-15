let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
let movieData = require("./movie-data-100.json");
let movies = [];
let nextMovieID=0;

movieData.forEach(movie => {
	movie.ID = nextMovieID;
	movie.Reviews = [];
	movies[nextMovieID++] = movie;
});
let users = [{
    name: "admin", password: "password", type: true, reviews: [], watchlist: [], followers: [], following: [], followingActors: []
}];
let persons = [];
let nextPersonID=0;
movies.forEach(async movie =>{
	for (let i=0; i<movie.Actors.length; i++){
		let exists = false;
		for(let j = 0; j < persons.length; j++) {
    		if (persons[j].name === movie.Actors[i]) {
        		exists = true;
        		break;
    		}
		}
		if(!exists){
			let newPerson = {
				name:movie.Actors[i],
				freqCol:[],
				writer:[],
				director:[],
				actor:[],
				ID:nextPersonID
			}
			newPerson.actor.push(movie);
			persons[nextPersonID++] = newPerson;
		}
		else{
			console.log("EXISTS: "+movie.Actors[i]);
			for(let j = 0; j < persons.length; j++) {
				if (persons[j].name === movie.Actors[i]) {
					persons[j].actor.push(movie);
				}
			}
		}
	}
	for (let i=0; i<movie.Director.length; i++){
		let exists = false;
		for(let j = 0; j < persons.length; j++) {
    		if (persons[j].name === movie.Director[i]) {
        		exists = true;
        		break;
    		}
		}
		if(!exists){
			let newPerson = {
				name:movie.Director[i],
				freqCol:[],
				writer:[],
				director:[],
				actor:[],
				ID:nextPersonID
			}
			newPerson.director.push(movie);
			persons[nextPersonID++] = newPerson;
		}
		else{
			console.log("EXISTS: "+movie.Director[i]);
			for(let j = 0; j < persons.length; j++) {
				if (persons[j].name === movie.Director[i]) {
					persons[j].director.push(movie);
				}
			}
		}
	}
	for (let i=0; i<movie.Writer.length; i++){
		let exists = false;
		for(let j = 0; j < persons.length; j++) {
    		if (persons[j].name === movie.Writer[i]) {
        		exists = true;
        		break;
    		}
		}
		if(!exists){
			let newPerson = {
				name:movie.Writer[i],
				freqCol:[],
				writer:[],
				director:[],
				actor:[],
				ID:nextPersonID
			}
			newPerson.writer.push(movie);
			persons[nextPersonID++] = newPerson;
		}
		else{
			console.log("EXISTS: "+movie.Writer[i]);
			for(let j = 0; j < persons.length; j++) {
				if (persons[j].name === movie.Writer[i]) {
					persons[j].writer.push(movie);
				}
			}
		}
	}
});
let reviews = [];


MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
	if (err) throw err;

	db = client.db('database');
	db.dropCollection("movies", function (err, result) {
		if (err) {
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)");
		} else {
			console.log("Cleared movie collection.");
		}
		db.collection("movies").insertMany(movies, function (err, result) {
			if (err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " movies.");
		})
	});
    
	db.dropCollection("users", function (err, result) {
		if (err) {
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)");
		} else {
			console.log("Cleared user collection.");
		}
        db.collection("users").insertMany(users, function (err, result) {
			if (err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " users.");
            
		})
	});
	db.dropCollection("persons", function (err, result) {
		if (err) {
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)");
		} else {
			console.log("Cleared persons collection.");
		}
        db.collection("persons").insertMany(persons, function (err, result) {
			if (err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " persons.");
		})
	});

	db.dropCollection("reviews", function (err, result) {
		if (err) {
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)");
		} else {
			console.log("Cleared reviews collection.");
		}
        db.createCollection("reviews", function(err,result){
			console.log("Created reviews collection");
			process.exit(1);
		});
	});
	//Create persons collection
	//Loop through movies array; for every person in the movie, if they are not in the database add them and the movie ID to their role
	//if they are in the database add the movie id to their array for that role
	
});

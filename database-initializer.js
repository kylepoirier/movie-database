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
			console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)");
		} else {
			console.log("Cleared movie collection.");
		}
		db.collection("movies").insertMany(movies, function (err, result) {
			if (err) throw err;
			console.log("Successfuly inserted " + result.insertedCount + " movies.");
			initPersonsCollection();
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
    //Create reviews collection
	db.dropCollection("reviews");
    db.createCollection("reviews");
	//Create persons collection
	//Loop through movies array; for every person in the movie, if they are not in the database add them and the movie ID to their role
	//if they are in the database add the movie id to their array for that role
	db.dropCollection("persons");
    db.createCollection("persons");
	
    
    
});

async function director() {
	let director = await db.collection("movies").distinct("Director");
	
	//console.log(director);
	
	for (let i=0; i<director.length; i++) {
		let check = await db.collection("persons").find({name: director[i]}).count();
		if (check === 0) {
			let person = {name: director[i], freqCol: [], writer: [], director: [], actor: []};
			//console.log("Not in database");
			db.collection("persons").insertOne(person)
		} else {
			console.log("In database:"+director[i]);
		}
	}
}
async function writer() {
	let writer = await db.collection("movies").distinct("Writer");
	
	//console.log(writer);
	
	for (let i=0; i<writer.length; i++) {
		let check = await db.collection("persons").find({name: writer[i]}).count();
		if (check === 0) {
			let person = {name: writer[i], freqCol: [], writer: [], director: [], actor: []};
			//console.log("Not in database");
			db.collection("persons").insertOne(person)
		} else {
			console.log("In database:"+writer[i]);
		}
	}
}
async function actor() {
	let actor = await db.collection("movies").distinct("Actors");
	
	//console.log(writer);
	
	for (let i=0; i<actor.length; i++) {
		let check = await db.collection("persons").find({name: actor[i]}).count();
		if (check === 0) {
			let person = {name: actor[i], freqCol: [], writer: [], director: [], actor: []};
			//console.log("Not in database");
			db.collection("persons").insertOne(person)
		} else {
			console.log("In database: "+actor[i]);
		}
	}
}
async function initPersonsCollection() {
	director();
	writer();
	actor();
}


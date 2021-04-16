const http = require('http');
const pug = require('pug');
const express = require('express');
let app = express();
app.set("view engine", "pug");
app.use(express.json());
app.use(express.urlencoded());
const session = require('express-session');
app.use(session({
    secret: 'some secret key here',
    viewedMovies: [],
	viewedUsers: [],
	loggedIn: false,
	user: null,
    resave: true,
    saveUninitialized: true,
	page: 0
}));

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
let update = 0;

//Set up the required data
const e = require('express');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

let returnedMovie = {};
let returnedPerson = {};
let reviewID = 0;
async function returnMovie(id){
	let results =  await db.collection("movies").find({ID: Number(id)}).toArray();
	return results;
}

//Initialize server
app.get("/", async(req,res,next)=>{
	res.redirect("/movies/page/"+0);
});

app.get("/movies/page/:page", async(req,res,next)=>{
	if (req.params.page === "0") {
		req.session.page = 0;
	} else if (req.params.page === "next") {
		req.session.page += 1;
		
	} else if (req.params.page === "prev") {
		if (req.session.page === 0) {
			req.session.page = 0;
		} else {
			req.session.page -= 1;
		}
	}
	let displayMovies = await db.collection("movies").find().limit(10).skip(Number(req.session.page)*10).toArray();
	//console.log(displayMovies);
	if (displayMovies.length === 0) {
		req.session.page -= 1;
		displayMovies = await db.collection("movies").find().limit(10).skip(Number(req.session.page)*10).toArray();
	}
	
	let data = pug.renderFile("index.pug", {movies: displayMovies});
	res.statusCode = 200;
	res.send(data);
});

app.get("/movie/:movieID", async(req,res,next)=>{
	if(req.session.viewedMovies){
		req.session.viewedMovies.push(req.params.movieID);

	}
	else{
		req.session.viewedMovies = [req.params.movieID];
	}

	returnedMovie = await returnMovie(req.params.movieID);
	let data = pug.renderFile("movie.pug",{movie:returnedMovie[0]});
	res.statusCode = 200;
	res.send(data);
});
app.get("/addWatchlist", async (req,res,next)=>{
	if(!req.session.loggedIn){
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	}
	else{
		let array = req.session.viewedMovies;
		let arraySize = array.length;
		let newMovie = await returnMovie(req.session.viewedMovies[arraySize-1]);
		db.collection("users").updateOne({"name":req.session.user.name},{$push:{"watchlist":newMovie[0]}});
		res.redirect("/movie/"+req.session.viewedMovies[arraySize-1]);
		res.statusCode = 200;
	}
});
app.get("/profile", async(req,res,next)=>{
	//Set up to send a user object, which would be the logged in one
	if(req.session.loggedIn){
		let profile = await db.collection("users").find({name : req.session.user.name}).toArray();
		
		let data = await pug.renderFile("ownProfile.pug",{user:profile[0]});
		res.statusCode = 200;
		res.end(data);
	}
	else{
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	}
	
});

app.post("/updateUser",async(req,res,next)=>{
	if (req.session.loggedIn) {
		if (Number(req.body.userType) === 0) {
			console.log("Updated profile; regular");
			await db.collection("users").updateOne({"name": req.session.user.name}, {$set: {"type": false}});
		} else if (Number(req.body.userType) === 1) {
			console.log("Updated profile; contributing");
			await db.collection("users").updateOne({"name": req.session.user.name}, {$set: {"type": true}});
		}
		res.redirect("/profile");
		res.statusCode = 200;
	} else {
		console.log("ERROR: Not logged in; redirecting to login page");
		res.redirect("/creation");
		res.statusCode = 200;
	}
});

app.get("/profile/:profile",async(req,res,next)=>{
	console.log(req.params.profile);
	let profile = await db.collection("users").find({name : req.params.profile}).toArray();
	console.log(profile);
	let data = pug.renderFile("otherProfile.pug",{user:profile[0]});
	res.statusCode = 200;
	res.end(data);
});

app.get("/person/:person", async(req,res,next)=>{
	returnedPerson = await returnPerson(req.params.person);
	let data = pug.renderFile("person.pug",{person:returnedPerson[0]});
	res.statusCode = 200;
	res.end(data);
});
async function returnPerson(personName){
	let results =  await db.collection("persons").find({name: personName}).toArray();
	return results;
}
app.get("/review/:reviewID", async(req,res,next)=>{
	console.log(req.params.reviewID);
	let result = await db.collection("reviews").find({id:Number(req.params.reviewID)}).toArray();
	console.log(result[0]);
	let data = pug.renderFile("review.pug",{review:result[0]});
	res.statusCode = 200;
	res.end(data);
});

app.get("/search", async(req,res,next)=>{
	let data = pug.renderFile("search.pug");
	res.statusCode = 200;
	res.end(data);
});

app.get("/creation", async(req,res,next)=>{
	if (!req.session.loggedIn) {
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	} else {
		res.redirect("/");
		console.log("ERROR: Cannot log in/sign up, already logged in.")
	}
	
	
});
app.get("/contribute", async(req,res,next)=>{
	let data = pug.renderFile("contribute.pug");
	res.statusCode = 200;
	res.end(data);
	
});

app.get("/searchresults/:Genre",async(req,res,next)=>{
	let query = {};
	query.Genre = req.params.Genre;
	let results = await db.collection("movies").find(query).toArray();
	let personResults = [];
	let data = pug.renderFile("searchResults.pug",{movies:results,persons:personResults}); 
	res.statusCode = 200;
	res.send(data);
});
app.post("/searchresults",async (req,res,next)=>{
	console.log(req.body.Title);
	console.log(req.body.Genre);
	console.log(req.body.Name);
	let personResults = [];
	let results = [];
	let query = {};
	let movieQuery=false;
	if(req.body.Title){
		query.Title = {"$regex" : ".*" + req.body.Title + ".*", "$options": "i"};
		movieQuery=true;
	}
	if(req.body.Genre){
		query.Genre = {"$regex" : ".*" + req.body.Genre + ".*", "$options": "i"}
		movieQuery=true;
	}
	if(req.body.Name){
		//Refer to persons database
		let personQuery={};
		personQuery.name = {"$regex" : ".*" + req.body.Name + ".*", "$options": "i"}
		personResults = await db.collection("persons").find(personQuery).toArray();
		
	}
	if(movieQuery){
		results = await db.collection("movies").find(query).toArray();
	}
	let data = pug.renderFile("searchResults.pug",{movies:results,persons:personResults}); 
	res.statusCode = 200;
	res.send(data);
});

app.post("/createAccount",async(req,res,next)=>{
	let user = req.body.username;
	let pass = req.body.password;
	//Search first, if username does not exist in username database then add.
	console.log(req.body.username);

	let users = await db.collection("users").find({name:user}).count();
	console.log(users);
	//If username does exist, alert to retry
	if (users === 0 && req.body.password.length!=0 && req.body.username !=0) {
		let newUser = {
			name: user,
			password: pass,
			type: false,
			reviews: [],
			watchlist: [],
			followers: [],
			following: [],
			followingActors: []
		}
		req.session.loggedIn = true;
		req.session.user = newUser;
		
		db.collection("users").insertOne(newUser,function(err,result){
			if(err){
				res.statusCode=200;
				res.end("Could not insert");
			}
			else{
				console.log("Inserted");
				res.statusCode = 200;
				res.redirect("/profile");
			}
		});

	} else {
		res.statusCode = 200;
		let data = pug.renderFile("creation.pug");
		res.send(data);
		if(users>0){
			console.log("ERROR: Username already exists");
		}
		if(req.body.password.length === 0 ){
			console.log("ERROR: Invalid Password");
		}
		if(req.body.username.length === 0 ){
			console.log("ERROR: Invalid Username");
		}
		
	}
	
});

app.post("/login",async(req,res,next)=>{
	let username = req.body.username;
	let password = req.body.password;
	//Check database, if matches update sessions user/pass
	
	let users = await db.collection("users").find({name:username}).toArray();
	
	if (users.length === 0 ){
		console.log("ERROR: Username not found");
	}
	
	users.forEach(user => {
		if(user.name === username){
			if(user.password === password){
				
				req.session.loggedIn = true;
				req.session.user = user;
				res.statusCode = 200;
				console.log("USER LOGGED IN");
				//let data = pug.renderFile("ownProfile.pug",{user:req.session.user});
				res.redirect("/profile");
			}
			else{
				console.log("ERROR: Entered wrong password");
			}
		}
	});
	
	
});

app.post("/addActor",async(req,res,next)=>{
	let actName = req.body.actorName;
	//Check if actor exists in database, if so, cannot add, if not... add actor to database
	if(!req.session.loggedIn){
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	}else{
		let last = await db.collection("persons").find({}).sort({_id:-1}).limit(1).toArray();
		let lastID = last[0].ID+1;
	
		let count = await db.collection("persons").find({name:actName}).count();
		console.log(count);
		if(!count){
			console.log("Person does not exist, adding");
			let newAct = {
				name:actName,
				freqCol: [],
				writer: [],
				director: [],
				actor: [],
				ID:lastID
			}
			console.log(newAct);
			db.collection("persons").insertOne(newAct);
		}
		else{
			console.log("Actor already exists");
		}
		//add newAct to database
		//Refresh page to the actors profile
		res.statusCode = 200;
		res.end("Actor addition Requested!");
	}
	
});
function removeWatchlist(){
	console.log("Button pressed");
}
app.post("/addMovie",async(req,res,next)=>{
	let last = await db.collection("movies").find({}).sort({_id:-1}).limit(1).toArray();
	let lastID = last[0].ID;

	let directors = req.body.directors.split(",");
	let writers = req.body.writers.split(",");
	let actors = req.body.actors.split(",");
	console.log(directors);
	console.log(writers);
	console.log(actors);
	let newMovie = {
		Title:req.body.title,
		Year:req.body.releaseYear,
		Rated:0,
		Released:0,
		Runtime: req.body.runtime,
		Genre:"Empty",
		Director: req.body.directors,
		Writer: req.body.writers,
		Actors: req.body.actors,
		Plot: "Empty",
		Awards: "Empty",
		Poster: "Empty",
		ID:lastID,
		reviews: []
	}
	
	//Add new movie to database
	res.statusCode = 200;
	res.end("Movie addition Requested!");
});

app.post("/addReview",async(req,res,next)=>{
	if (!req.session.loggedIn) {
		console.log("Not Logged In");
		res.statusCode = 200;
		let data = pug.renderFile("creation.pug");
		res.send(data);
	} else {
		
		let lastID;

		let count = await db.collection("reviews").find().count();

		if (count === 0) {
			lastID = 0;
		} else {
			let last = await db.collection("reviews").find({}).sort({_id:-1}).limit(1).toArray();
			lastID = last[0].id +1;
		}
	
		let array = req.session.viewedMovies;
		let arraySize = array.length;
		let newReview = {
			reviewer: req.session.user.name,
			movie: req.session.viewedMovies[arraySize-1],
			score: req.body.reviewScore,
			sum: req.body.sumReview,
			full: req.body.fullReview,
			id: lastID
		};
		console.log(newReview);
		db.collection("reviews").insertOne(newReview);

		db.collection("movies").updateOne({"ID":Number(req.session.viewedMovies[arraySize-1])},{$push:{"Reviews":newReview}});
		console.log(req.session.user.name);
		db.collection("users").updateOne({"name":req.session.user.name},{$push:{"reviews":newReview}});
		
		res.redirect("/movie/"+req.session.viewedMovies[arraySize-1]);
		res.statusCode = 200;
	}
});

app.post("/addReview/full?",async(req,res,next)=>{
	res.statusCode = 200;
	res.end("Review full addition Requested!");
});

app.get("/logout",async(req,res,next)=>{
	if(!req.session.loggedIn){
		console.log("Not Logged In");
		res.statusCode = 200;
		let data = pug.renderFile("creation.pug");
		res.send(data);
	}else{
		req.session.loggedIn = false;
		req.session.user=null;
		res.statusCode = 200;
		let data = pug.renderFile("creation.pug");
		res.send(data);
	}
	
});

// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  //Get the database
  db = client.db('database');

  // Start server once Mongo is initialized
  app.listen(3000);
	console.log("Listening on port 3000");
});


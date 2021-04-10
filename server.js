const http = require('http');
const pug = require('pug');
const express = require('express');
let app = express();
app.set("view engine", "pug");
app.use(express.json());
//app.use(express.urlencoded());
const session = require('express-session');
app.use(session({
    secret: 'some secret key here',
    viewedMovies: [],
	loggedIn: false,
	user: null,
    resave: true,
    saveUninitialized: true

}));

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;

//Set up the required data
const e = require('express');
let returnedMovie = {};


async function returnMovie(id){
	let results =  await db.collection("movies").find({ID: Number(id)}).toArray();
	return results;
}

//Initialize server
app.get("/", async(req,res,next)=>{
	let displayMovies = await db.collection("movies").find().toArray();
	let data = pug.renderFile("index.pug", {movies: displayMovies});
	res.status=200;
	if(req.session.loggedIn){
		console.log(req.session.user.name);
	}
	
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
	res.status=200;
	res.send(data);
});

app.get("/ownProfile", async(req,res,next)=>{
	//Set up to send a user object, which would be the logged in one
	let data = pug.renderFile("exampleProfile.pug");
	res.statusCode = 200;
	res.end(data);
});

app.get("/profile/:profileID",async(req,res,next)=>{
	let data = pug.renderFile("exampleOtherProfile.pug");
	res.statusCode = 200;
	res.end(data);
});

app.get("/person/:personID", async(req,res,next)=>{
	let data = pug.renderFile("examplePerson.pug");
	res.statusCode = 200;
	res.end(data);
});

app.get("/review/:reviewID", async(req,res,next)=>{
	let data = pug.renderFile("exampleReview.pug");
	res.statusCode = 200;
	res.end(data);
});

app.get("/search", async(req,res,next)=>{
	let data = pug.renderFile("search.pug");
	res.statusCode = 200;
	res.end(data);
	
});

app.get("/creation", async(req,res,next)=>{
	let data = pug.renderFile("creation.pug");
	res.statusCode = 200;
	res.end(data);
	
});
app.get("/contribute", async(req,res,next)=>{
	let data = pug.renderFile("contribute.pug");
	res.statusCode = 200;
	res.end(data);
	
});

app.post("/searchresults?",async (req,res,next)=>{
	let searchResults = movies;
	let data = pug.renderFile("resultsExample.pug",{movies:searchResults});
	res.statusCode = 200;
	res.end(data);
});

app.post("/createAccount",async(req,res,next)=>{
	let user = req.body.username;
	let pass = req.body.password;
	//Search first, if username does not exist in username database then add.
	let users = await db.collection("users").find({name: user}).count();
	console.log(users);
	//If username does exist, alert to retry
	if (users === 0) {
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
	
		res.statusCode = 200;
		let data = pug.renderFile("exampleProfile.pug");
		res.send(data);
	} else {
		res.statusCode = 200;
		let data = pug.renderFile("creation.pug");
		res.send(data);
		console.log("ERROR: Username already exists");
	}
	
});

app.post("/login",async(req,res,next)=>{
	let username = req.body.username;
	let password = req.body.password;
	//Check database, if matches update sessions user/pass
	//Allert if fail
	req.session.loggedIn = true;
	req.session.user = "RETURNED USER"

	res.statusCode = 200;
	let data = pug.renderFile("index.pug", {movies: movies});
	res.send(data);
});

app.post("/addActor",async(req,res,next)=>{
	let actName = req.body.actorName;
	//Check if actor exists in database, if so, cannot add, if not... add actor to database
	let newAct = {
		name:actName,
		freqCol: [],
		writer: [],
		director: [],
		actor: []
	}

	//add newAct to database
	console.log(newAct);
	//Refresh page to the actors profile
	res.statusCode = 200;
	res.end("Actor addition Requested!");
});

app.post("/addMovie",async(req,res,next)=>{

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
		ID:nextID++,
		reviews: "Empty"
	}

	//Add new movie to database
	console.log(newMovie);
	res.statusCode = 200;
	res.end("Movie addition Requested!");
});

app.post("/addReview/basic?",async(req,res,next)=>{
	res.statusCode = 200;
	res.end("Review basic addition Requested!");
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
	}
	req.session.loggedIn = false;
	req.session.user=null;
	res.statusCode = 200;
	res.end("Logged out!");
});
// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  //Get the t8 database
  db = client.db('database');

  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on port 3000");
});
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
	watchList: [],
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
let returnedPerson = {};
async function returnMovie(id){
	let results =  await db.collection("movies").find({ID: Number(id)}).toArray();
	return results;
}


//Initialize server
app.get("/", async(req,res,next)=>{
	let displayMovies = await db.collection("movies").find().toArray();

	let data = pug.renderFile("index.pug", {movies: displayMovies});
	res.status=200;
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
app.get("/addWatchlist", async (req,res,next)=>{
	console.log(req.session.viewedMovies);
	if(!req.session.loggedIn){
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	}
	else{
		let lastElement = req.session.viewedMovies[req.session.viewedMovies.length -1];
		console.log(lastElement);
		if(req.session.watchList){
			console.log("Pushed");
			req.session.watchList.push(lastElement);

		}
		else{
			console.log("Init");
			req.session.watchList = [lastElement];
		}
		console.log(req.session.watchList);
		res.status=200;
	}
});
app.get("/ownProfile", async(req,res,next)=>{
	//Set up to send a user object, which would be the logged in one
	if(req.session.loggedIn){
		let data = pug.renderFile("ownProfile.pug",{user:req.session.user});
		res.statusCode = 200;
		res.end(data);
	}
	else{
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	}
	
});

app.get("/profile/:profileID",async(req,res,next)=>{
	let data = pug.renderFile("exampleOtherProfile.pug");
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

	//let users = await db.collection("users").find({name:user}).count();
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
				let data = pug.renderFile("ownProfile.pug",{user:req.session.user});
				res.send(data)
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
				let data = pug.renderFile("ownProfile.pug",{user:req.session.user});
				res.send(data);
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


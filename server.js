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
	viewedPersons: [],
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
	
	let simMovies = await db.collection("movies").find({"Genre":returnedMovie[0].Genre}).toArray();
	let data = pug.renderFile("movie.pug",{movie:returnedMovie[0], similar:simMovies.slice(0,5)});
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
app.get("/removeWatchlist", async (req,res,next)=>{
	if(!req.session.loggedIn){
		let data = pug.renderFile("creation.pug");
		res.statusCode = 200;
		res.end(data);
	}
	else{
		let array = req.session.viewedMovies;
		let arraySize = array.length;
		let newMovie = await returnMovie(req.session.viewedMovies[arraySize-1]);
		db.collection("users").updateOne({"name":req.session.user.name},{$pull:{"watchlist":newMovie[0]}});
		res.redirect("/movie/"+req.session.viewedMovies[arraySize-1]);
		res.statusCode = 200;
	}
});

app.get("/profile", async(req,res,next)=>{
	//Set up to send a user object, which would be the logged in one
	if(req.session.loggedIn){
		let profile = await db.collection("users").find({name : req.session.user.name}).toArray();
		let simMovies=[];
		
		for(let i=0; i<profile[0].watchlist.length;i++){
			let movie = profile[0].watchlist[i];
			let listForMovie = await db.collection("movies").find({"Genre":movie.Genre}).toArray();
			for(let j=0; j<listForMovie.length;j++){
				if(movie.ID != listForMovie[j].ID){
					simMovies.push(listForMovie[j])
				}
				
			}
		}
		simMovies.sort(function (a, b) { return 0.5 - Math.random() });
		let data = await pug.renderFile("ownProfile.pug",{user:profile[0], similar:simMovies.slice(0,5)});
		res.statusCode = 200;
		res.end(data);

		
	}
	else{
		res.redirect("/creation");
		res.statusCode = 200;
	}
	
});

app.post("/updateUser",async(req,res,next)=>{
	if (req.session.loggedIn) {
		if (Number(req.body.userType) === 0) {
			console.log("Updated profile; regular");
			await db.collection("users").updateOne({"name": req.session.user.name}, {$set: {"contributor": false}});
		} else if (Number(req.body.userType) === 1) {
			console.log("Updated profile; contributing");
			await db.collection("users").updateOne({"name": req.session.user.name}, {$set: {"contributor": true}});
		}
		res.redirect("/profile");
		res.statusCode = 200;
	} else {
		console.log("ERROR: Not logged in; redirecting to login page");
		res.redirect("/creation");
		res.statusCode = 200;
	}
});

app.post("/followPerson", async(req, res,next)=> {
	let person = req.session.viewedPersons[req.session.viewedPersons.length-1];
	if (!req.session.loggedIn) {
		res.redirect("/creation");
	} else {
		let check = await db.collection("users").findOne({"name": req.session.user.name, "followingPersons":person});
		if (check === null) {
			db.collection("users").updateOne({"name": req.session.user.name}, {$push: {"followingPersons": person}});
			db.collection("persons").updateOne({"name": person}, {$push: {"followers": req.session.user.name}});
			res.redirect("/person/"+person);
		} else {
			console.log("ERROR: Already following person")
			res.redirect("person/"+person);
		}
	}
});

app.post("/unfollowPerson", async(req, res,next)=> {
	let person = req.session.viewedPersons[req.session.viewedPersons.length-1];
	if (!req.session.loggedIn) {
		res.redirect("/creation");
	} else {
		let check = await db.collection("users").findOne({"name": req.session.user.name, "followingPersons":person});
		if (!(check===null)) {
			db.collection("users").updateOne({"name": req.session.user.name}, {$pull: {"followingPersons": person}});
			db.collection("persons").updateOne({"name": person}, {$pull: {"followers": req.session.user.name}});
			res.redirect("/person/"+person);
		} else {
			console.log("ERROR: Not following person");
			res.redirect("person/"+person);
		}
	}
});

app.post("/followUser", async(req, res,next)=> {
	let user = req.session.viewedUsers[req.session.viewedUsers.length-1];
	if (!req.session.loggedIn) {
		res.redirect("/creation");
	} else {
		let check = await db.collection("users").findOne({"name": req.session.user.name, "following":user});
		if ((check === null)) {
			db.collection("users").updateOne({"name": req.session.user.name}, {$push: {"following": user}});
			db.collection("users").updateOne({"name": user}, {$push: {"followers": req.session.user.name}});
			res.redirect("/profile/"+user);
		} else {
			console.log("ERROR: Already following user")
			res.redirect("/profile/"+user);
		}
	}
});

app.post("/unfollowUser", async(req, res,next)=> {
	let user = req.session.viewedUsers[req.session.viewedUsers.length-1];
	if (!req.session.loggedIn) {
		res.redirect("/creation");
	} else {
		let check = await db.collection("users").findOne({"name": req.session.user.name, "following":user});
		if (!(check === null)) {
			db.collection("users").updateOne({"name": req.session.user.name}, {$pull: {"following": user}});
			db.collection("users").updateOne({"name": user}, {$pull: {"followers": req.session.user.name}});
			res.redirect("/profile/"+user);
		} else {
			console.log("ERROR: Not following user")
			res.redirect("/profile/"+user);
		}
	}
});

app.get("/profile/:profile",async(req,res,next)=>{
	if(req.session.viewedUsers){
		req.session.viewedUsers.push(req.params.profile);

	}
	else{
		req.session.viewedUsers = [req.params.profile];
	}
	let profile = await db.collection("users").find({name : req.params.profile}).toArray();
	let data = pug.renderFile("otherProfile.pug",{user:profile[0]});
	res.statusCode = 200;
	res.end(data);
});

app.get("/person/:person", async(req,res,next)=>{
	if(req.session.viewedPersons){
		req.session.viewedPersons.push(req.params.person);
	}
	else{
		req.session.viewedPersons = [req.params.person];
	}
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
	let result = await db.collection("reviews").find({id:Number(req.params.reviewID)}).toArray();
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
	if (req.session.loggedIn) {	
		let profile = await db.collection("users").find({name : req.session.user.name}).toArray();
		if (profile[0].contributor === true) {
			let data = pug.renderFile("contribute.pug");
			res.statusCode = 200;
			res.end(data);
		} else {
			console.log("ERROR: Not a contributing user");
			res.redirect("/profile");
			res.statusCode = 200;
		}
	} else {
		console.log("ERROR: User not logged in");
		res.redirect("/creation");
		res.statusCode = 200;
	}
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

	let users = await db.collection("users").find({name:user}).count();
	//If username does exist, alert to retry
	if (users === 0 && req.body.password.length!=0 && req.body.username !=0) {
		let newUser = {
			name: user,
			password: pass,
			contributor: false,
			reviews: [],
			watchlist: [],
			followers: [],
			following: [],
			followingPersons: [],
			users: [],
			notifications: []
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

		if(!count){
			
			let newAct = {
				name:actName,
				freqCol: [],
				writer: [],
				director: [],
				actor: [],
				ID:lastID
			}
			console.log(newAct);
			if(newAct.name != ""){
				console.log("Person does not exist, adding");
				db.collection("persons").insertOne(newAct);
			}
			
		}
		else{
			console.log("Person already exists");
		}
		//add newAct to database
		//Refresh page to the actors profile
		res.statusCode = 200;
		res.redirect("/person/"+actName);
	}
	
});
async function notify(notifType,notifName,ID){
	if(notifType==="movie"){
		let person = await db.collection("persons").findOne({name:notifName});
		let followers = person.followers;
		let newNotif={
			type:notifType,
			subject:person,
			url:"/movie/"+ID,
			infoStr:person.name+" has a role in a new movie",
		}
		followers.forEach(follower => {
			db.collection("users").updateOne({"name": follower},{$push:{notifications:newNotif}});
		});
	}
	if(notifType==="review"){
		let user = await db.collection("users").findOne({name:notifName});
		let followers = user.followers;
		let newNotif={
			type:notifType,
			subject:user,
			url:"/review/"+ID,
			infoStr:user.name+" has curated a new review!",
		}
		followers.forEach(follower => {
			db.collection("users").updateOne({"name": follower},{$push:{notifications:newNotif}});
		});
	}
}
app.post("/addMovie",async(req,res,next)=>{
	let last = await db.collection("movies").find({}).sort({_id:-1}).limit(1).toArray();
	let lastID = last[0].ID +1;
	let lastPerson = await db.collection("persons").find({}).sort({_id:-1}).limit(1).toArray();
	let lastPersonID = lastPerson[0].ID + 1;

	let directors = req.body.directors;
	directors = directors.split(",").map(function (value) {
		return value.trim();
	});
	let writers = req.body.writers;
	writers = writers.split(",").map(function (value) {
		return value.trim();
	});
	let actors = req.body.actors;
	actors = actors.split(",").map(function (value) {
		return value.trim();
	});
	let genre = req.body.genre;
	genre = genre.split(",").map(function (value) {
		return value.trim();
	});


	let newMovie = {
		Title:req.body.title,
		Year:req.body.releaseYear,
		Rated:0,
		Released:0,
		Runtime: req.body.runtime,
		Genre:genre,
		Director:directors,
		Writer: writers,
		Actors: actors,
		Plot: "Empty",
		Awards: "Empty",
		Poster: "Empty",
		ID:lastID,
		Reviews: []
	}



	for(let i=0; i<directors.length;i++){
		let count = await db.collection("persons").find({name:directors[i]}).count();
		if(!count){
			let newPerson = {
				name:directors[i],
				freqCol: [],
				writer: [],
				director: [newMovie],
				actor: [],
				ID:lastPersonID
			}
			if(newPerson.name != ""){
				console.log(directors[i]+ " does not exist, adding");
				db.collection("persons").insertOne(newPerson);
			}
		}
		else{
			console.log("Person already exists");
			db.collection("persons").updateOne({"name":directors[i]},{$push:{"director":newMovie}});
			notify("movie", directors[i],lastID);
		}
	}
	for(let i=0; i<writers.length;i++){
		let count = await db.collection("persons").find({name:writers[i]}).count();
		if(!count){
			let newPerson = {
				name:writers[i],
				freqCol: [],
				writer: [newMovie],
				director: [],
				actor: [],
				ID:lastPersonID
			}
			if(newPerson.name != ""){
				console.log(writers[i]+ " does not exist, adding");
				db.collection("persons").insertOne(newPerson);
			}
		}
		else{
			db.collection("persons").updateOne({"name":writers[i]},{$push:{"writer":newMovie}});
			console.log("Person already exists");
			notify("movie", writers[i],lastID);
		}
	}
	for(let i=0; i<actors.length;i++){
		let count = await db.collection("persons").find({name:actors[i]}).count();
		if(!count){
			let newPerson = {
				name:actors[i],
				freqCol: [],
				writer: [],
				director: [],
				actor: [newMovie],
				ID:lastPersonID
			}
			if(newPerson.name != ""){
				console.log(actors[i]+ " does not exist, adding");
				db.collection("persons").insertOne(newPerson);
			}
		}
		else{
			console.log("Person already exists");
			db.collection("persons").updateOne({"name":actors[i]},{$push:{"actor":newMovie}});
			notify("movie", actors[i],lastID);
		}
	}

	db.collection("movies").insertOne(newMovie);
	//Add new movie to database
	res.statusCode = 200;
	res.redirect("/movie/"+lastID);
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
		if(Number(req.body.reviewScore)> 10 || Number(req.body.reviewScore <0)){
			console.log("ERROR: Invalid review score, enter value between 0-10");
		}else{
			let array = req.session.viewedMovies;
			let arraySize = array.length;
			let newReview = {
				reviewer: req.session.user.name,
				movie: req.session.viewedMovies[arraySize-1],
				score: req.body.reviewScore+"/10",
				sum: req.body.sumReview,
				full: req.body.fullReview,
				id: lastID
			};
			db.collection("reviews").insertOne(newReview);
	
			db.collection("movies").updateOne({"ID":Number(req.session.viewedMovies[arraySize-1])},{$push:{"Reviews":newReview}});
			db.collection("users").updateOne({"name":req.session.user.name},{$push:{"reviews":newReview}});
			
			res.redirect("/movie/"+req.session.viewedMovies[arraySize-1]);
			notify("review",req.session.user.name,lastID)
			res.statusCode = 200;
		}
		
	}
});

app.get("/logout",async(req,res,next)=>{
	if(!req.session.loggedIn){
		console.log("Not Logged In");
		res.statusCode = 200;
		res.redirect("/creation");
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


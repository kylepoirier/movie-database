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
    resave: true,
    saveUninitialized: true

}));


//Set up the required data
let movieData = require("./movie-data-10.json");
const e = require('express');
let movies = {}; //Stores all of the movies, key=id
let returnedMovie = {};
let nextID=0;
movieData.forEach(movie => {
	movie.ID = nextID;
	movies[nextID++] = movie;
});

function returnMovie(ID){
    let searchArray = movieData.filter(function(obj){

        let objID = obj.ID;
        if(objID==ID){
            return obj;
        }
    });
    searchArray.forEach(movie=>{
        returnedMovie[0] = movie;
    });
}
//Initialize server

app.get("/", async(req,res,next)=>{
	let data = pug.renderFile("index.pug", {movies: movies});
	res.status=200;
	res.send(data);
	console.log(req.session.viewedMovies);
});

app.get("/movie/:movieID", async(req,res,next)=>{
	if(req.session.viewedMovies){
		req.session.viewedMovies.push(req.params.movieID);
	}
	else{
		req.session.viewedMovies = [req.params.movieID];
	}
	
	returnMovie(req.params.movieID);
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
	let username = req.body.username;
	let password = req.body.password; 
	console.log(username);
	console.log(password);
	
	res.statusCode = 200;
	res.end("Creation Requested!");
});

app.post("/login?",async(req,res,next)=>{
	res.statusCode = 200;
	res.end("Login Requested!");
});

app.post("/addActor?",async(req,res,next)=>{
	res.statusCode = 200;
	res.end("Actor addition Requested!");
});

app.post("/addMovie?",async(req,res,next)=>{
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

app.listen(3000);
console.log("Server listening at http://localhost:3000");
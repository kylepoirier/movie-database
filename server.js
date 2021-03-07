const http = require('http');
const pug = require('pug');

//Set up the required data
let movieData = require("./movie-data-10.json");
let movies = {}; //Stores all of the cards, key=id
let returnedMovie = {};
let nextID=0;
movieData.forEach(movie => {
	movies[nextID++] = movie;
});

function returnMovie(movieName){
    let searchArray = movieData.filter(function(obj){

        let objTitle = obj.Title;
        if(objTitle===movieName){
            return obj;
        }
    });
    searchArray.forEach(movie=>{
        returnedMovie[0] = movie;
    });
}
//Initialize server
const server = http.createServer(function (request, response) {
	//console.log(request.method);
	if(request.method === "GET"){
        let movieTitle = request.url;
		movieTitle = movieTitle.split("/")[2];
		
		if(request.url === "/" || request.url === "/index.pug"){
            //console.log(movies);
			let data = pug.renderFile("index.pug", {movies: movies});
			response.statusCode = 200;
			response.end(data);
			return;
		}
		if(request.url === "/movie/"+movieTitle){
            movieTitle = decodeURI(movieTitle);
            returnMovie(movieTitle);
            //console.log(movie);
			let data = pug.renderFile("movie.pug",{movie:returnedMovie[0]});
			response.statusCode = 200;
			response.end(data);
			return;		
		}
        if(request.url === "/ownProfile"){
            let data = pug.renderFile("exampleProfile.pug");
			response.statusCode = 200;
			response.end(data);
			return;	
        }
        if(request.url === "/profile"){
            let data = pug.renderFile("exampleOtherProfile.pug");
			response.statusCode = 200;
			response.end(data);
			return;	
        }
        if(request.url === "/person"){
            let data = pug.renderFile("examplePerson.pug");
			response.statusCode = 200;
			response.end(data);
			return;
        }
        if (request.url === "/reviews"){
            let data = pug.renderFile("exampleReview.pug");
			response.statusCode = 200;
			response.end(data);
			return;
        }

        if(request.url === "/search"){
            let data = pug.renderFile("search.pug");
			response.statusCode = 200;
			response.end(data);
			return;
        }
        if(request.url === "/creation"){
            let data = pug.renderFile("creation.pug");
			response.statusCode = 200;
			response.end(data);
			return;
        }
		if (request.url === "/contribute") {
			let data = pug.renderFile("contribute.pug");
			response.statusCode = 200;
			response.end(data);
			return;
		}

	}
    if(request.method === "POST"){
        if(request.url==="/searchresults?"){
            let searchResults = movies;
            let data = pug.renderFile("resultsExample.pug",{movies:searchResults});
			response.statusCode = 200;
			response.end(data);
			return;
        }
        if(request.url==="/createAccount?"  || request.url==="/login?" ){
			response.statusCode = 200;
			response.end("Created/Logged In Requested!");
			return;
        }
		if (request.url==="/addActor?") {
			response.statusCode = 200;
			response.end("Actor Added");
			return;
		}
		if (request.url==="/addMovie?") {
			response.statusCode = 200;
			response.end("Movie Added");
			return;
		}
    }

	else{
		response.statusCode = 404;
		response.write("Unknwn resource.");
		response.end();
	}
	
});

//Start server
server.listen(3000);
console.log("Server listening at http://localhost:3000");
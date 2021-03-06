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
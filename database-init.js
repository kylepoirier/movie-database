
const mongoose = require('mongoose');
const Movie = require("./MovieModel");
const User = require("./UserModel");
const Review = require("./ReviewModel");
const Persons = require("./PersonsModel");
const fs = require("fs");
const csv = require('csv-parser')

let nextID = 0;

mongoose.connect('mongodb://localhost/database', {useNewUrlParser: true});
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	mongoose.connection.db.dropDatabase(function(err, result){
		if(err){
			console.log("Error dropping database:");
			console.log(err);
			return;
		}
		console.log("Dropped database. Starting re-creation.");

		let movies = JSON.parse(fs.readFileSync("movie-data-10.json"));
		movies.forEach(movie => {
			let m = new Movie(movie);
            m.ID = nextID++;
			m.save(async function(err){
				if (err) throw err;
                console.log("added movie");
                //Persons collection (director init)
                await m.Director.forEach(director => {
                    Persons.findOne({name: director}).then((result => {
                        if(result) {
                            console.log(`Successfully found document: ${result.director}.`);
                            result.director.push(m._id);
                            result.save();
                          } else {
                            //console.log("No document matches the provided query.");
                            let p = new Persons({
                                name: director,
                                director: m._id
                            });
                            p.save(function(err) {
                                if (err) throw err;
                                //console.log("added director person");
                            });
                          }
                    })); 
                });
                await m.Writer.forEach(writer => {
                    Persons.findOne({name: writer}).then((result => {
                        if(result) {
                            console.log(`Successfully found document: ${result.writer}.`);
                            result.writer.push(m._id);
                            result.save();
                          } else {
                            //console.log("No document matches the provided query.");
                            let p = new Persons({
                                name: writer,
                                writer: m._id
                            });
                            p.save(function(err) {
                                if (err) throw err;
                                //console.log("added writer person");
                            });
                          }
                    })); 
                });
                await m.Actors.forEach(actor => {
                    Persons.findOne({name: actor}).then((result => {
                        if(result) {
                            console.log(`Successfully found document: ${result.actor}.`);
                            result.actor.push(m._id);
                            result.save();
                          } else {
                            //console.log("No document matches the provided query.");
                            let p = new Persons({
                                name: actor,
                                actor: m._id
                            });
                            p.save(function(err) {
                                if (err) throw err;
                                //console.log("added actor person");
                            });
                          }
                    })); 
                });
			});
		});   
	});
});

/**
 * Created by adrian on 17.01.17.
 */
/** Module dependencies **/
var express = require('express');
var bodyParser = require('body-parser');
var stringify = require('json-stringify-safe');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var urlencodedParser = bodyParser.urlencoded({extended: true});
var router = express.Router();
var mongoDbURL = 'mongodb://localhost:27017/projekt2';




/***********************************************************************************************************************
 *                                  MOVIES CRUD SECTION
 ***********************************************************************************************************************/

/** GET /movies **/
router.get('/', function (req, res, next) {

    var data = {};
    MongoClient.connect(mongoDbURL, function(err, db) {
        assert.equal(null, err);
        var col = db.collection('movies');
        col.find({}).toArray(function (err, items) {
            data.items = items;
            db.close();
            res.render('movies_list', data);
        })
    });
});

/** GET /movies/add **/
router.get('/add', function (req, res) {
    var actor = {};
    res.render('movie_creation_edition', {movie: {}});
});

/** GET /movies/:id/edit **/
router.get('/:id/edit', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(mongoDbURL, function(err, db) {
        assert.equal(null, err);
        var _id = require("mongoose").Types.ObjectId(id);
        var col = db.collection('movies');
        col.findOne({"_id": _id}, function (err, result) {
            console.log("Result: " + JSON.stringify(result));
            var movie = {};
            movie._id  = result._id;
            movie.name = result.name;
            movie.label_image = result.label_image;
            movie.background_image = result.background_image;
            movie.description = result.description;
            movie.gatunek = result.gatunek;
            movie.rezyseria = result.rezyseria;
            movie.scenariusz = result.scenariusz;
            movie.produkcja = result.produkcja;
            movie.premiera = result.premiera;
            movie.premiera_rok = result.premiera_rok;
            movie.ocena = result.ocena;
            movie.obsadaIDS = result.obsada;
            console.log(stringify(movie))
            db.collection('actors').find().toArray(function (err, items) {
                db.close();
                res.render('movie_creation_edition', {movie: movie, actors: items});
            });
        });
    });
});

/** GET /movies/:id/details **/
router.get('/:id/details', function (req, res, next) {
    var id = req.params.id;

    MongoClient.connect(mongoDbURL, function(err, db) {
        assert.equal(null, err);
        var _id = require("mongoose").Types.ObjectId(id);

        var movies = db.collection('movies');
        movies.findOne({"_id" : _id}, function (err, result) {
            console.log("Result: " + JSON.stringify(result));
            var movie = {};
            movie._id  = result._id;
            movie.name = result.name;
            movie.label_image = result.label_image;
            movie.background_image = result.background_image;
            movie.description = result.description;
            movie.gatunek = result.gatunek;
            movie.rezyseria = result.rezyseria;
            movie.scenariusz = result.scenariusz;
            movie.produkcja = result.produkcja;
            movie.premiera = result.premiera;
            movie.premiera_rok = result.premiera_rok;
            movie.ocena = result.ocena;
            movie.obsadaIDS = result.obsada;
            db.collection('actors').find({ _id : { $in : movie.obsadaIDS } }).toArray(function (err, items) {
                db.close();
                res.render('movie_details', {movie: movie, cast: items});
            });
        });
    });
});

//* POST /movies/add **/
router.post('/add', urlencodedParser, function (req, res) {
    console.log("Body: " + stringify(req.body));
    MongoClient.connect(mongoDbURL, function (err, db) {

        var col = db.collection('movies');

        /** update case **/
        if (req.body.movie_id) {
            /** save only properties **/
            var _id = require("mongoose").Types.ObjectId(req.body.movie_id);
            var movie = {};
            movie.name = req.body.movie_name;
            movie.label_image = req.body.movie_label_image;
            movie.background_image = req.body.movie_background_image;
            movie.description = req.body.movie_description;
            movie.gatunek = req.body.movie_gatunek;
            movie.rezyseria = req.body.movie_rezyseria;
            movie.scenariusz = req.body.movie_scenariusz;
            movie.produkcja = req.body.movie_produkcja;
            movie.premiera = req.body.movie_premiera;
            movie.premiera_rok = req.body.movie_premiera_rok;
            movie.ocena = req.body.movie_ocena;
            movie.obsada = generateKeysArray(req.body.actors_list);

            //Update current entity in db and redirect to list ...
            col.update({_id: _id }, {$set: movie});
            db.close();
            res.redirect('/movies');
        }
        /** add case **/
        else {
            /** Insert new one and redirect to list **/
            var movie = {};
            movie.name = req.body.movie_name;
            movie.label_image = req.body.movie_label_image;
            movie.background_image = req.body.movie_background_image;
            movie.description = req.body.movie_description;
            movie.gatunek = req.body.movie_gatunek;
            movie.rezyseria = req.body.movie_rezyseria;
            movie.scenariusz = req.body.movie_scenariusz;
            movie.produkcja = req.body.movie_produkcja;
            movie.premiera = req.body.movie_premiera;
            movie.premiera_rok = req.body.movie_premiera_rok;
            movie.ocena = req.body.movie_ocena;
            movie.obsada = generateKeysArray(req.body.actors_list);
            col.insert(movie, function (err, result) {
                db.close();
                res.redirect('/movies');
            })
        }

    });
});

function generateKeysArray(stringArray){
    var result = [];
    for(var i = 0; i < stringArray.length; i++){
        result.push(require("mongoose").Types.ObjectId(stringArray[i]));
    }
    return result;
}

/** GET movies/:id/remove **/
router.get('/:id/remove', function (req, res, next) {
    var id = req.params.id;
    MongoClient.connect(mongoDbURL, function (err, db) {
        var col = db.collection('movies');

        var a = require('mongoose').Types.ObjectId(id);
        col.deleteOne({"_id": a}, function (err, result) {
            db.close();
            res.redirect('/movies');
        });

    })
});


/***********************************************************************************************************************
 *                                  MOVIES ADDITIONAL SECTION
 ***********************************************************************************************************************/
//Lista filmów z conajmniej dwoma aktorami
router.get('/movies-table-gt', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var data = {};
        db.collection('movies')
            .find({ $where: "this.obsada.length > 1" })
            .toArray(function (err, items) {
                data.items = items;
                db.close();
                res.render('movies_list', data);
        })
    });
});

//Lista filmów z oceną powyżej 3.0
router.get('/movies-table-rate-grater', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var data = {};
        db.collection('movies')
            .find({ocena: {$gt: 3.0}})
            .toArray(function (err, items) {
                data.items = items;
                db.close();
                res.render('movies_list', data);
            })
    });
});

//Lista filmów posortowanych według oceny
router.get('/movies-table-rate-sorted', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var data = {};
        db.collection('movies')
            .find({})
            .sort({"ocena" : 1})
            .toArray(function (err, items) {
                data.items = items;
                db.close();
                res.render('movies_list', data);
            })
    });
});

//Lista filmów posortowanych według oceny
router.get('/year_16_estados_unidos', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var data = {};
        db.collection('movies')
            .find({$and:[{produkcja: {$in: ["United States"]}},{premiera_rok: {$gt: 2016}}]})
            .sort({"ocena" : 1})
            .toArray(function (err, items) {
                data.items = items;
                db.close();
                res.render('movies_list', data);
            })
    });
});

//seriale_po_2016_roku
router.get('/seriale_lub_horrory_w_2016_roku', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var data = {};
        db.collection('movies')
            .find({$and:[{gatunek: {$in: ["Serial", "Horror"]}},{premiera_rok: {$eq: 2016}}]})
            .sort({"ocena" : 1})
            .toArray(function (err, items) {
                data.items = items;
                db.close();
                res.render('movies_list', data);
            })
    });
});


/***********************************************************************************************************************
 *                                              AGREGACJE
 **********************************************************************************************************************/


//average_movie_rate_in_particular_years
router.get('/average_movie_rate_in_particular_years', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var col = db.collection('movies');

        col.aggregate([
            // Stage 1
            {
                $group: {
                    _id: "$premiera_rok",
                    AvgRate : { $avg : "$ocena" },
                    Count : { $sum : 1}

                }
            },

            // Stage 2
            {
                $project: {
                    _id:1, AvgRate:1, Count: 1
                }
            },

            // Stage 3
            {
                $match: {
                    _id:{'$ne':null}
                }
            },

            // Stage 4
            {
                $sort: {
                    AvgRate:-1
                }
            }

        ]).toArray(function (err, result) {
            var str = 'Srednio oceniane filmy w poszczególnych latach: \n'+
                'Ilość rekordów: ' + result.length + '\n';


            for(var i=0; i<result.length; i++) {
                str += 'Rok: '+ result[i]._id + ',\t Srednia ocena:'+ result[i].AvgRate + ',\t Liczba filmow:' + result[i].Count + '\n' ;
            }
            res.end(str);
        })
    });
});



//three_rezysers_with_best_rated_movies
router.get('/three_rezysers_with_best_rated_movies', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var col = db.collection('movies');

        col.aggregate([
            // Stage 1
            {
                $group: {
                    _id: "$rezyseria",
                    Rate : { $avg : "$ocena"}
                }
            },

            // Stage 2
            {
                $project: {
                    _id:1, Rate:1
                }
            },

             //Stage 3
            {
                $match: {
                    _id:{'$ne':null}
                }
            },

            // Stage 4
            {
                $sort: {
                    Rate:-1
                }
            },
            //Stage 5
            {
                $limit: 3
            }

        ]).toArray(function (err, result) {
            var str = 'Lista reżyserów z najlepiej ocenianymi filmami: \n'+
                'Ilość rekordów: ' + result.length + '\n';


            for(var i=0; i<result.length; i++) {
                str += 'Rezyseria: '+ result[i]._id + ',\t Srednia ocena:'+ result[i].Rate + '\n' ;
            }
            res.end(str);
        })
    });
});


//movies_with_three_or_more_actors
router.get('/movies_with_three_or_more_actors', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var col = db.collection('actors');

        col.aggregate([
            {
                $unwind: "$obsadaIDS"
            },
            {
                $lookup: {
                    "from": "obsadaIDS",
                    "localField": "obsadaIDS",
                    "foreignField": "_id",
                    "as": "cast"
                }
            }/*,

            // Stage 1
            {
                $match: {
                    country : "United States",
                    name: {
                        $ne: "Brad Pitt"
                    }
                }
            },
            // Stage 2
            {
                $project: {
                    _id: 1, country: 1, name: 1, height: 1
                }
            },
            // Stage 3
            {
                $sort: {
                    height : -1
                }
            },
            // Stage 4
            {
                $limit: 3
            },
            //Stage 5
            {
                $project: {
                    _id: 0, country: 1, name: 1, height: 1
                }
            }*/

        ]).toArray(function (err, result) {
            /*var str = 'Trzech najwyższych aktorow ze stanow nie licząc Brada Pitta: \n'+
                'Ilość rekordów: ' + result.length + '\n';


            for(var i=0; i<result.length; i++) {
                str += 'Nazwa kraju: '+ result[i]._country + ',\t Aktor:'+ result[i].name + ',\t Wzrost:' + result[i].height + '\n' ;
            }
            res.end(str);*/
            res.end(stringify(err));
        })
    });
});
module.exports = router;


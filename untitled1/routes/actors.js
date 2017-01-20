/**
 * Created by adrian on 17.01.17.
 */
/** Module dependencies **/
var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var urlencodedParser = bodyParser.urlencoded({extended: true});
var router = express.Router();
var mongoDbURL = 'mongodb://localhost:27017/projekt2';

/** Helper methods **/

function dodajDaneDruzyny(user, teams) {
    if (user.team && user.team._id) {
        var p_id = require('mongoose').Types.ObjectId(user.team._id);
        for (var j = 0; j < teams.length; j++) {
            var t_id = require('mongoose').Types.ObjectId(teams[j]._id);
            if (p_id.equals(t_id)) {
                user.team_data = teams[j];
            }
        }
    }
    else {
        user.team_data = null;
    }
}

/***********************************************************************************************************************
 *                                  ACTORS CRUD SECTION
 * *********************************************************************************************************************/
/** GET /actors/ **/
router.get('/', function (req, res, next) {

    var data = {};
    MongoClient.connect(mongoDbURL, function(err, db) {
        assert.equal(null, err);
        var col = db.collection('actors');
        col.find({}).toArray(function (err, items) {
            data.items = items;
            db.close();
            res.render('actors_list', data);
        })
    });
});

/** GET /actors/add **/
router.get('/add', function (req, res) {
    var actor = {};
    res.render('actor_details', {});
});

/** GET /actors/:id/edit **/
router.get('/:id/edit', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(mongoDbURL, function(err, db) {
        assert.equal(null, err);
        var _id = require("mongoose").Types.ObjectId(id);
        var col = db.collection('actors');
        col.findOne({"_id": _id}, function (err, result) {
            console.log('Result: ' + JSON.stringify(result));
            var actor = {};
            actor._id = result._id
            actor.name = result.name;
            actor.description = result.description;
            actor.dob = result.dob;
            actor.country = result.country;
            actor.height = result.height;
            actor.spouse = result.spouse;
            actor.children = result.children;
            actor.image = result.image;
            db.close();
            res.render('actor_details', actor);

        });
    });
});

//* POST /actors/add **/
router.post('/add', urlencodedParser, function (req, res) {

    MongoClient.connect(mongoDbURL, function (err, db) {

        var col = db.collection('actors');

        /** update case **/
        if (req.body.actor_id) {
            /** save only properties **/
            var _id = require("mongoose").Types.ObjectId(req.body.actor_id);
            var actor = {};
            actor.name = req.body.actor_name;
            actor.description = req.body.actor_description;
            actor.dob = req.body.actor_dob;
            actor.country = req.body.actor_country;
            actor.height = req.body.actor_height;
            actor.spouse = req.body.actor_spouse;
            actor.children = req.body.actor_children;
            actor.image = req.body.actor_image;

            //Update current entity in db and redirect to list ...
            col.update({_id: _id }, {$set: actor});
            db.close();
            res.redirect('/actors');
        }
        /** add case **/
        else {
            var actor = {};
            actor.name = req.body.actor_name;
            actor.description = req.body.actor_description;
            actor.dob = req.body.actor_dob;
            actor.country = req.body.actor_country;
            actor.height = req.body.actor_height;
            actor.spouse = req.body.actor_spouse;
            actor.children = req.body.actor_children;
            actor.image = req.body.actor_image;

            /** Insert new one and redirect to list **/
            col.insert(actor, function (err, result) {
                db.close();
                res.redirect('/actors');
            })
        }

    });
});

/** GET actors/:id/remove **/
router.get('/:id/remove', function (req, res, next) {
    var id = req.params.id;
    MongoClient.connect(mongoDbURL, function (err, db) {
        var col = db.collection('actors');

        var a = require('mongoose').Types.ObjectId(id);
        col.deleteOne({"_id": a}, function (err, result) {
            db.close();
            res.redirect('/actors');
        });

    })
});

/** GET /movies/ **/
router.get('/', function (req, res, next) {

    var data = {};
    MongoClient.connect(mongoDbURL, function(err, db) {
        assert.equal(null, err);
        var col = db.collection('actors');
        col.find({}).toArray(function (err, items) {
            data.items = items;
            db.close();
            res.render('actors_list', data);
        })
    });
});


/***********************************************************************************************************************
 *                                  ACTORS ADDITIONAL SECTION
 ***********************************************************************************************************************/
router.get('/soltero', function (req, res, next) {
    MongoClient.connect(mongoDbURL, function (err, db) {
        var data = {};
        db.collection('actors')
            .find({ $where: "this.spouse.length == 0" })
            .toArray(function (err, items) {
                data.items = items;
                db.close();
                res.render('movies_list', data);
            })
    });
});


module.exports = router;


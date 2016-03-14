var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('databases/words.sqlite');
//don't need this if we want it to be case insensitive (this is sqlite stuff):
db.run("PRAGMA case_sensitive_like = true");

var Twitter = require('twitter');
var credentials = require("../.credentials.js");
var twitParams = credentials.twitParams;
var twitClient = new Twitter(credentials.twitCredentials);

router.get('/', function(req, res, next) {
  var count = 0;
  db.get("SELECT COUNT(*) AS tot FROM words", function(err, row) {
    var respText = "Words API: " + row.tot + " words online.";
    res.send(respText);
  });
});

// We'll implement our API here...
router.get('/count/:abbrev', function(req, res, next) {
  var abbrev = req.params.abbrev;
  var caseSensitive = req.query.caseSensitive;
  //our default, case-INsensitive query clause:
  var likeClause = "lower (word) LIKE lower('" + abbrev + "%')";
  var alen = abbrev.length;
  var dataArray = [];
  if (caseSensitive === "true") {
    var likeClause = "word LIKE '" + abbrev + "%'";
  }
  var sql = "SELECT substr(word,1," + alen + "+1) AS abbr, " + " count(*) AS wordcount FROM words " + " WHERE " + likeClause + " GROUP BY substr(word,1," + alen + "+1)"
  db.all(sql, function(err, rows) {
    for (var i = 0; i < rows.length; i++) {
      dataArray[i] = {
        abbrev: rows[i].abbr,
        count: rows[i].wordcount
      }
    }
    res.send(dataArray); //Express will stringify data, set Content-type
  });
});
router.get('/search/:abbrev', function(req, res, next) {
  var abbrev = req.params.abbrev;
  var caseSensitive = req.query.caseSensitive;
  //our default, case-INsensitive query clause:
  var likeClause = "lower (word) LIKE lower('" + abbrev + "%')";
  if (caseSensitive === "true") {
    var likeClause = "word LIKE '" + abbrev + "%'";
  }
  var threshold = req.query.threshold;
  if (threshold && abbrev.length < Number(threshold)) {
    res.status(204).send() //204: Success, No Content.
    return;
  }
  var query = ("SELECT id, word FROM words " + " WHERE " + likeClause + " ORDER BY word ");
  db.all(query, function(err, data) {
    if (err) {
      res.status(500).send("Database Error");
    } else {
      res.status(200).json(data);
    }
  })
});
router.get('/dictionary/:wordId', function(req, res, next) {
  console.log("first route");
  var id = req.params.wordId;
  console.log(id);
  var query = ("SELECT id, word FROM words WHERE id = " + id);
  db.get(query, function(err, data) {
    if (err) {
      res.status(500).send("DatabaseError");
    } else {
      // res.status(200).json(data);
      res.wordData = data;
      //refers to next .get (this is middleware):
      next();
    }
  });
});
router.get('/dictionary/:wordId', function(req, res, next) {
  console.log("second route: Twitter");
  var word = res.wordData.word;
  res.wordData.twitter = {};
  var twitSearch = "https://api.twitter.com/1.1/search/tweets.json?";
  twitSearch += "q=";
  twitSearch += "lang%3Aen%20"; //english
  twitSearch += "%23" + word; //#wordData
  twitSearch += "&result_type=recent";
  twitClient.get(twitSearch, twitParams, function(error, tweets, response) {
    if(error) {
      console.error("Twitter FAIL!");
      console.error(error);
    }else {
      res.wordData.twitter = tweets;
    }
    res.status(200).json(res.wordData);
  });

});
router.delete('/dictionary/:wordId', function(req, res, next) {
  var wordId = req.params.wordId;
  var query = ("DELETE FROM words WHERE id = " + wordId);
  db.run(query, function(err) {
    console.log(query);
    if (err) {
      res.status(500).send("Database Error");
    } else {
      res.status(202).send();
    }
  });
});
router.put('/dictionary/:wordId', function(req, res, next) {
  var wordId = req.params.wordId;
  var word = req.body.word;
  console.log(wordId);
  var query = ("UPDATE words SET word = '" + word + "' WHERE id = " + wordId);
  db.run(query, function(err) {
    console.log(query);
    if (err) {
      if (err.errno == 19) {
        res.status(400).send("Duplicate");
      } else {
        res.status(500).send("Database Error");
      }
    } else {
      var newWord = {
        id: wordId,
        word: word
      };
      res.status(200).send(newWord);
    }
  });
});
router.post('/dictionary/:word', function(req,res,next) {
  var word = req.body.word;
  console.log(word);
  var query = "INSERT INTO words (word) VALUES('"+ word +"')";
  db.run(query, function(err) {
    if (err) {
      if (err.errno == 19) {
        res.status(400).send("Duplicate");
      } else {
        res.status(500).send("Database Error");
      }
    } else {
      var newId = this.lastID;
      var newWord = {
        id: newId,
        word: word
      };
      res.status(200).send(newWord);
    }
  });
});

module.exports = router;

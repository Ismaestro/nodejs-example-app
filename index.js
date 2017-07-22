var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var pg = require('pg');

var jsonParser = bodyParser.json();

app.set('port', process.env.PORT || 3000);

app.use(cors());

app.get('/heroes', function (req, res) {
  pg.connect(process.env.DATABASE_URL, function (err, client, done) {
    client.query('SELECT id, name, alter_ego as "alterEgo", likes, default_hero as "defaultHero" FROM heroes',
      function (err, result) {
        done();
        if (err) {
          console.error(err);
          res.status(500).send({});
        }
        else {
          res.send(result.rows);
        }
      });
  });
});

app.get('/heroes/:id', function (req, res) {
  var heroes = JSON.parse(fs.readFileSync('./heroes.json', 'utf8'));
  for (var i = 0; i < heroes.length; i++) {
    if (heroes[i].id === Number(req.params.id)) {
      res.send(JSON.stringify(heroes[i]));
      return;
    }
  }
  res.status(404).send('Not found');
});

app.post('/heroes', jsonParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  var heroes = JSON.parse(fs.readFileSync('./heroes.json', 'utf8'));
  var newHero = req.body;

  pg.connect(process.env.DATABASE_URL, function (err, client, done) {
    client.query(
      'INSERT into heroes (name, alter_ego, likes, default_hero) VALUES ($1, $2, $3, $4) RETURNING id',
      [newHero.name, newHero.alterEgo, 0, false], function (err, result) {
        done();
        if (err) {
          console.error(err);
          res.status(500).send({});
        }
        else {
          res.send(result);
        }
      });
  });
});

app.post('/heroes/:id/like', jsonParser, function (req, res) {
  var heroes = JSON.parse(fs.readFileSync('./heroes.json', 'utf8'));
  for (var i = 0; i < heroes.length; i++) {
    if (heroes[i].id === Number(req.params.id)) {
      heroes[i].likes += 1;
    }
  }
  fs.writeFileSync('./heroes.json', JSON.stringify(heroes));
  res.send();
});

app.delete('/heroes/:id', jsonParser, function (req, res) {
  const idToRemove = Number(req.params.id);

  var heroes = JSON.parse(fs.readFileSync('./heroes.json', 'utf8'));
  for (var i = 0; i < heroes.length; i++) {
    if (heroes[i].id === idToRemove && heroes[i].default) {
      res.status(500).send('Default hero');
      return;
    } else if (heroes[i].id === idToRemove) {
      heroes.splice(i, 1);
    }
  }
  fs.writeFileSync('./heroes.json', JSON.stringify(heroes));
  res.send(heroes);
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

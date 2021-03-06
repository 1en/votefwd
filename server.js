 //server.js
'use strict'

var express = require('express');
var cors = require('cors');
var path = require('path');
var bodyParser = require('body-parser');
var pdf = require('html-pdf');
var Storage = require('@google-cloud/storage');
var Handlebars = require('handlebars');
var Hashids = require('hashids');
var uuidv4 = require('uuid/v4');

var rateLimits = require('./ratelimits')
var voterService = require('./voterService');
var letterService = require('./letterService');
var db = require('./src/db');
var fs = require('fs');
var os = require('os');

var app = express();
var router = express.Router();
var port = process.env.REACT_APP_API_PORT || 3001;
var corsOption = {
  origin: true,
  moethods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  credentials: true,
}

var hashids = new Hashids(process.env.REACT_APP_HASHID_SALT, 6,
  process.env.REACT_APP_HASHID_DICTIONARY);

//app.use(express.static(path.join(__dirname, 'build')));
app.use(cors(corsOption));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.get('/', function(req, res) {
  res.json('API initialized.');
});

router.route('/voters')
  .get(function(req, res) {
    voterService.getUsersAdoptedVoters(req.query.user_id,
      function(result) {
        res.json(result)
      });
  });

router.route('/voter/adopt-random')
  .post(function(req, res) {
    voterService.adoptRandomVoter(req.body.adopterId, function(voter, pdfUrl) {
      let response = {};
      response.voter = voter;
      response.pdfUrl = pdfUrl;
      res.json(response);
    });
  });

router.route('/voter/confirm-send')
  .put(function(req, res) {
    voterService.confirmSend(req.body.id, function(result) {
      res.json(result);
    });
  });

router.route('/voter/pledge')
  .post(rateLimits.makePledgeRateLimit, function(req, res) {
    voterService.makePledge(req.body.code, function(result) {
      res.json(result);
    });
  });

router.route('/voter/signed-letter-url')
  .get(function(req, res) {
    letterService.getSignedUrl(req.query.url, function(result) {
      res.json(result);
    });
  });

router.route('/user/new')
  .post(function(req, res) {
    if (req.body.auth0_id) {
      db('users').where('auth0_id', req.body.auth0_id)
        .then(function(result) {
          if (result.length != 0) {
            res.status(200).send('User already exists.');
          }
          else {
            db('users').insert({auth0_id: req.body.auth0_id})
              .then(function(result) {
              res.status(201).send(result);
            });
          }
        })
        .catch(err => {console.error(err)});
    }
  })

router.route('/user')
  .get(function(req, res) {
    db('users')
      .where('auth0_id', req.query.auth0_id)
      .then(function(result) {
        res.json(result)
      })
      .catch(err => {console.error(err);})
  })
  .post(function(req, res) {
    let query = db('users')
      .where('auth0_id', req.body.auth0_id)
      .update('updated_at', db.fn.now())
    if (req.body.isHuman) {
      query.update('is_human_at', db.fn.now())
      .catch(err=> {console.error('ERROR: ', err)})
    }
    if (req.body.fullName) {
      query.update('full_name', req.body.fullName)
      .catch(err=> {console.error('ERROR: ', err)})
    }
    if (req.body.isResident) {
      query.update('is_resident_at', db.fn.now())
      .catch(err=> {console.error('ERROR: ', err)})
    }
    if (req.body.zip) {
      query.update('zip', req.body.zip)
      .catch(err=> {console.error('ERROR: ', err)})
    }
    if (req.body.agreedCode) {
      query.update('accepted_code_at', db.fn.now())
      .catch(err=> {console.error('ERROR: ', err)})
    }
  });

//Use router configuration at /api
app.use('/api', router);

//start server and listen for requests
app.listen(port, function() {
  console.log(`api running on port ${port}`);
});

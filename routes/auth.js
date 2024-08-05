const express = require('express');
const router = express.Router();
const querystring = require('querystring')
const crypto = require('crypto')
const request = require('request');
const userController = require('../controllers/user.controller')

const {checkNotAuthenticated, checkAuthenticated} = require('../config/spotifyAuth')


var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URL;

var stateKey = 'spotify_auth_state';

// router.use(checkNotAuthenticated);

router.get('/', checkNotAuthenticated, (req, res, next) => {
    res.render('signin');
});

router.get('/login', checkNotAuthenticated, function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    var scope = `user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read user-follow-read user-read-recently-played user-top-read`;
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
        show_dialog : false
      })
    );
});
  
const generateRandomString = (length) => {
  return crypto
  .randomBytes(60)
  .toString('hex')
  .slice(0, length);
}

router.get('/callback', checkNotAuthenticated, (req, res, next) => {

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

  
    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
            error: 'state_mismatch'
          }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
          json: true
        };
        
        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
      
              var access_token = body.access_token;
              var refresh_token = body.refresh_token;
              var expires_in = body.expires_in;
                
              // on success save tokens in session
              req.session.accessToken = access_token;
              req.session.refreshToken = refresh_token;
              req.session.expiresAt = (new Date().getTime() / 1000) + expires_in;

              userController.saveSpotifyUserDetails(req, res, next);

              res.redirect('/');

            } else {
              res.redirect('/#' +
                querystring.stringify({
                  error: 'invalid_token'
                }));
            }
          });
        }
});

router.get('/refresh_token', checkAuthenticated,function(req, res) {

    var refresh_token = req.session.refreshToken;
    
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) 
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        var refresh_token = body.refresh_token;
        var expires_in = body.expires_in;
        
        req.session.accessToken = access_token;
        req.session.refreshToken = refresh_token;
        req.session.expiresAt = (new Date().getTime() / 1000) + expires_in;
        
        res.redirect('/');
      }
      
    });
});

router.get('/logout', checkAuthenticated, (req, res, next)=>{ 
  req.session.accessToken = null;
  // console.log(req.session);
  res.redirect('/auth')
})


module.exports = router;

const User = require('../models/user.model');
const SpotifyUser = require('../models/spotifyUser.model');

const request = require('request');


exports.saveSpotifyUserDetails = async function(req, res, next){
    try {
        const accessToken = req.session.accessToken;
        
        var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + accessToken },
            json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, async function(error, response, body) {
            
            let query = {email : body.email};
            let update = {
                name : body.display_name,
                spotify_url : body.external_urls.spotify,
                image : body.images[1].url,
                type : body.type,
                followers : body.followers.total,
                country : body.country
            };
            let options = {upsert: true, setDefaultsOnInsert: true};
            await SpotifyUser.findOneAndUpdate(query, update, options);

            next();
        });

    } catch (error) {
        console.log(error);
        next();
    }
}

exports.createNewUser = async function(req, res, next){
    try {
        
        next();

    } catch (error) {
        console.log(error);
        next();
    }
}

exports.getAllUsers = async function(req, res, next){
    try {
        const spotifyUsers = await SpotifyUser.find();
        
        res.locals.spotify_users = spotifyUsers;

        next();

    } catch (error) {
        console.log(error);
        next();
    }
}

exports.getNumberOfUsers = async function(req, res, next){
    try {
        const spotifyUsers = await SpotifyUser.find();
        
        res.locals.users = spotifyUsers.length;

        next();

    } catch (error) {
        console.log(error);
        next();
    }
}
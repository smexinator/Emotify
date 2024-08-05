const mongoose = require('mongoose');

const spotifyUserSchema = new mongoose.Schema({
    name : {
        type : String
    },
    email : {
        type : String
    },
    spotify_url : {
        type : String
    },
    image : {
        type : String
    },
    type : {
        type : String
    },
    followers : {
        type : String
    },
    country : {
        type : String
    }
},
{
    timestamps : true
});

const SpotifyUser = mongoose.model('SpotifyUser', spotifyUserSchema);

module.exports = SpotifyUser;
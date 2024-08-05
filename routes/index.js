const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotify.controller')

const {
    checkAuthenticated,
    getAuthenticatedUser,
  } = require("../config/spotifyAuth");

router.use(checkAuthenticated);
router.use(getAuthenticatedUser);

router.get('/', spotifyController.getFollowedUsers, spotifyController.getMyTopTracks, (req, res, next) => {
    res.locals.root_email = process.env.ROOT_EMAIL;
    res.render('index');
});



router.get('/get-songs/:emotion/', spotifyController.getRecommendedSongs, (req, res, next)=>{
    res.render('songs');
});

router.get('/get-playlists/:emotion/', spotifyController.getRecommendedPlaylists, (req, res, next)=>{
    res.render('playlists');
});

router.get('/get-songs-from-my-playlists/:emotion/:local', spotifyController.getSongsFromMyPlaylists, (req, res, next)=>{
    res.render('songs');
});


module.exports = router;

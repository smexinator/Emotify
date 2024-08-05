const Emotion = require('../models/emotion.model')

const querystring = require('querystring')

const emotionGenreMapping = {
    'neutral': 'chill,classical,hip-hop,romance,acoustic',
    'happy': 'pop,disco,alt-rock',
    'sad': 'blues,soul,folk,country,sad',
    'angry': 'rock,hard-rock,heavy-metal,punk,hardcore',
    'fearful': 'ambient',
    'surprised': 'electronic,edm,electro'
    
};

const emotionCategoryMapping = {
    'neutral': 'chill,classical,hiphop,romance,focus,instrumental,travel',
    'happy': 'pop,desi,party,summer,house,reggae,funk',
    'sad': 'blues,soul,folk,country,mood,classical,rock,alternative',
    'angry': 'rock,punk,metal,hiphop,techno,trap',
    'fearful': 'ambient,chill,jazz,soul,',
    'surprised': 'travel,country,anime,discover'
    
};

exports.getRecommendedSongs = async function(req, res, next){
    try {
        const accessToken = req.session.accessToken;
        
        const emotion = req.params.emotion;
        const genre = emotionGenreMapping[emotion.toLowerCase()];
        // const local = req.params.local == 'yes' ? res.locals.user_details['country'] : '';

        let URL = 'https://api.spotify.com/v1/recommendations?';
        const limit = 30;
        URL += `limit=${limit}`;
        
        if (genre) {
            URL += `&seed_genres=${genre}`;

            const response = await fetch(URL, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });
            
            const data = await response.json();
            res.locals.tracks = data.tracks;

        }

        saveEmotionsData(req, res);

        next();

    } catch (error) {
        console.log(error);
        next();
    }
}

exports.getRecommendedPlaylists = async function(req, res, next){
    try {
        const accessToken = req.session.accessToken;
        
        const emotion = req.params.emotion;
        const categories = emotionCategoryMapping[emotion.toLowerCase()];
        // const local = req.params.local == 'yes' ? res.locals.user_details['country'] : '';
        const limit = 10;

        //splitting genres to array for looping
        let categoriesArray = categories.split(",");

        let playlistsData = [];

        //Fetch playlists for different genres
        for (let category of categoriesArray){
            let URL = `https://api.spotify.com/v1/browse/categories/${category}/playlists?`;
            URL += `limit=${25}`;


            const response = await fetch(URL, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });
            
            const data = await response.json();

            //check if resource is available
            if (!data.error){
                let items = data.playlists.items
                for (let item of items){
                    playlistsData.push(item)    
                }
            }
        }

        // Shuffle the array using Fisher-Yates algorithm
        for (let i = playlistsData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playlistsData[i], playlistsData[j]] = [playlistsData[j], playlistsData[i]];
        }
        playlistsData = playlistsData.slice(0, limit); // 10 categories limit
        
        console.log(playlistsData);
        res.locals.data = playlistsData;

        saveEmotionsData(req, res);

        next();

    } catch (error) {
        console.log(error);
        next();
    }
}

exports.getSongsFromMyPlaylists = async function(req, res, next){
    try {
        const accessToken = req.session.accessToken;

        const emotion = req.params.emotion;
        const genre = emotionGenreMapping[emotion.toLowerCase()];
        const local = req.params.local == 'yes' ? res.locals.user_details['country'] : '';
        
        //Get user playlists first
        const playlists = await getUserPlaylists(accessToken);

        const targetPlaylists = playlists.map(playlist => playlist.id);

        // return res.send(targetPlaylists)
        
        // let tracksArr = []
        if (targetPlaylists.length > 0) {
            
            const tracks = await getPlaylistTracks(targetPlaylists[0], accessToken);
            res.locals.myTracks = tracks;            

        } else {
            console.log('Playlist not found.');
        }

        // let URL = 'https://api.spotify.com/v1/recommendations?';
        // const limit = 30;
        // URL += `limit=${limit}`;

        // if (genre) {
        //     URL += `&seed_genres=${genre}`;

        //     if (local){
        //         URL += `&market=${local}`
        //     }

        //     const response = await fetch(URL, {
        //         method: 'GET',
        //         headers: {
        //             'Authorization': 'Bearer ' + accessToken
        //         }
        //     });
            
        //     const data = await response.json();
        //     res.locals.tracks = data.tracks;
        // }

        next();

    } catch (error) {
        console.log(error);
        next();
    }
}

// Function to get followed users from Spotify API
exports.getFollowedUsers = async function(req, res, next) {
    const accessToken = req.session.accessToken;
    const limit = req.query.limit || 10; // Default to 10 if no limit is provided in the query

    const response = await fetch(`https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();

    res.locals.artists = data.artists.items;

    next();
}


exports.getMyTopTracks = async function(req, res, next) {
    const accessToken = req.session.accessToken;
    const limit = req.query.limit || 10; // Default to 10 if no limit is provided in the query

    const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();

    // console.log(data.items);

    res.locals.top_tracks = data.items;

    next();
}

async function getUserPlaylists(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return data.items;
}

async function getPlaylistTracks(playlistId, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return data.items;
}

async function saveEmotionsData(req, res) {
    const filter = { emotion: req.params.emotion }; // condition to find the document
    const update = { emotion: req.params.emotion, $inc : {frequency: 1 }}; // update data
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    await Emotion.findOneAndUpdate(filter, update, options)
}
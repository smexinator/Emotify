const request = require('request');

module.exports = {
    checkAuthenticated: function (req, res, next){
        if (req.session.accessToken){
            //check if token is expired!
            if (req.session.expiresAt < (new Date().getTime() / 1000)){
                console.log('refresh token');
                return res.redirect('/auth/refresh_token')
            }
            return next()
        }
        res.redirect('/auth');
    },
    
    checkNotAuthenticated: function(req, res, next){
        if(req.session.accessToken){
            if (req.session.expiresAt < (new Date().getTime() / 1000)){
                return res.redirect('/auth/refresh_token')
            }
            return res.redirect('/');
        }
        next();
    },

    getAuthenticatedUser: function(req, res, next){
        if(req.session.accessToken){
            
            try {
                const accessToken = req.session.accessToken;
                
                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + accessToken },
                    json: true
                };
        
                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    
                    res.locals.user_details = body;
                    
                    next();
                });
        
            } catch (error) {
                console.log(error);
                next();
            }
        
        } else {
            next();
        }

    }
};
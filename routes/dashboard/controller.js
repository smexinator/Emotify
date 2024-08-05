var express = require('express');
var router = express.Router();

const {
    checkAuthenticated,
    getAuthenticatedUser,
  } = require("../../config/spotifyAuth");

//Routes
const indexRoute = require('./index');
const usersRoute = require('./users');

router.use(checkAuthenticated);
router.use(getAuthenticatedUser);

router.use('/' ,(req, res, next)=>{
    if (res.locals.user_details['email'] == process.env.ROOT_EMAIL){
        
        router.use('/', indexRoute);
        router.use('/users', usersRoute);
    } 
    
    next();
})


module.exports = router;

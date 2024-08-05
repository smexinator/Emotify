const express = require("express");
const router = express.Router();
const {getNumberOfUsers} = require('../../controllers/user.controller')
const {getEmotionsData} = require('../../controllers/emotion.controller')

router.get("/", getNumberOfUsers, getEmotionsData, (req, res, next) => {
  res.render("dashboard/index");
});

module.exports = router;

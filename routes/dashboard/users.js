const express = require("express");
const router = express.Router();
const userController = require('../../controllers/user.controller');


router.get("/", userController.getAllUsers, (req, res, next) => {
  res.render("dashboard/users");
});

module.exports = router;

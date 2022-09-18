const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const CycleonLocationModel = require("../../models/CycleonLocations");
const auth = require("../../middleware/auth");

// @route       POST /api/locations/getLocation
// @desc        Fetches closest locations
// @access      Private
// @parameters  -
router.get("/getLocation", auth, async (req, res) => {
  try {
    let location = await CycleonLocationModel.find();
    return res.json(location);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;

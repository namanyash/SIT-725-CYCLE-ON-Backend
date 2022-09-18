const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const CycleonLocationModel = require("../../models/CycleonLocations");
// const jwt = require('jsonwebtoken');
// const config =  require('config');
const adminAuth = require("../../middleware/adminAuth");
const idGenerator = require("../../helper/idGenerator");

// @route       POST /api/adminActions/addLocation
// @desc        Allows Admins to add locations
// @access      Private - only accessible to the existing admins
// @parameters  locationName(String), coordinates(String)
router.post(
  "/addLocation",
  [
    check(
      "locationName",
      "Please include a location name with 4 or more characters"
    ).isLength({ min: 4 }),
    check("coordinates", "Please include coordinates").not().isEmpty(),
  ],
  adminAuth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { locationName, coordinates, bikes } = req.body;

    try {
      let location = await CycleonLocationModel.findOne({ coordinates });
      if (location) {
        return res.status(400).json({
          errors: [{ msg: "Location with these coordinates exists" }],
        });
      }

      location = await CycleonLocationModel.findOne({ locationName });
      if (location) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Location with this name exists" }] });
      }

      location = new CycleonLocationModel({
        locationName,
        coordinates,
        bikes: [],
      });

      await location.save();

      return res.json(location);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       POST /api/adminActions/addBike
// @desc        Allows Admins to add bikes to locations
// @access      Private - only accessible to the existing admins
// @parameters  name(String), description(String), locationName(String)
router.post(
  "/addBike",
  [
    check(
      "name",
      "Please enter a bike name with 4 or more characters"
    ).isLength({ min: 2 }),
    check(
      "description",
      "Please enter a description with 10 or more characters"
    ).isLength({ min: 10 }),
    check(
      "locationName",
      "Please enter a locationName with 4 or more characters"
    ).isLength({ min: 4 }),
  ],
  adminAuth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, locationName } = req.body;

    try {
      let location = await CycleonLocationModel.findOne({ locationName });
      if (!location) {
        return res.status(400).json({
          errors: [
            { msg: `Location with the name ${locationName} does not exist` },
          ],
        });
      }
      location = await CycleonLocationModel.findOneAndUpdate(
        { _location: locationName },
        {
          $push: { bikes: { name, description, _id: idGenerator.makeid(24) } },
        },
        { new: true }
      );
      res.send(location);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       DELETE /api/adminActions/deleteBike
// @desc        Allows Admins to delete bikes from locations
// @access      Private - only accessible to the existing admins
// @parameters  locationName(String), bikeId(String)
router.delete(
  "/deleteBike",
  [
    check(
      "locationName",
      "Please enter a locationName with 4 or more characters"
    ).isLength({ min: 4 }),
    check("bikeId", "bikeId cannot be empty").not().isEmpty(),
  ],
  adminAuth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { locationName, bikeId } = req.body;
    try {
      let location = await CycleonLocationModel.findOne({ locationName });
      if (!location) {
        return res.status(400).json({
          errors: [
            { msg: `Location with the name ${locationName} does not exist` },
          ],
        });
      }
      let location_updated = await CycleonLocationModel.findOneAndUpdate(
        { _location: locationName },
        { $pull: { bikes: { _id: bikeId } } },
        { new: true, passRawResult: true }
      );
      if (location.bikes.length == location_updated.bikes.length) {
        return res
          .status(400)
          .json({ errors: [{ msg: `Bike does not exist` }] });
      }
      res.send(location);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       DELETE /api/adminActions/deleteLocation
// @desc        Allows Admins to delete locations
// @access      Private - only accessible to the existing admins
// @parameters  locationName(String)
router.delete("/deleteLocation", adminAuth, async (req, res) => {
  const { locationName, bikeId } = req.body;
  try {
    let location = await CycleonLocationModel.findOneAndDelete({
      locationName,
    });
    if (!location) {
      return res.status(400).json({
        errors: [
          { msg: `Location with the name ${locationName} does not exist` },
        ],
      });
    }
    res.send(location);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;

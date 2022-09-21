const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const CycleonLocationModel = require("../../models/CycleonLocations");
const auth = require("../../middleware/auth");
const User = require("../../models/User");

// @route       POST /api/rides/bookRide
// @desc        Alloes users to book rides
// @access      Private
// @parameters  startLocationName(String) locationName(String), bikeId(String)
router.put(
  "/bookRide",
  [
    check(
      "startLocationName",
      "Please enter a locationName with 4 or more characters"
    ).isLength({ min: 4 }),
    check(
      "endLocationName",
      "Please enter a locationName with 4 or more characters"
    ).isLength({ min: 4 }),
    check("bikeId", "bikeId cannot be empty").not().isEmpty(),
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { startLocationName, endLocationName, bikeId } = req.body;
    try {
      let startLocation = await CycleonLocationModel.findOne({
        startLocationName,
      });
      if (!startLocation) {
        return res.status(400).json({
          errors: [
            {
              msg: `Location with the name ${startLocationName} does not exist`,
            },
          ],
        });
      }

      let endLocation = await CycleonLocationModel.findOne({
        endLocationName,
      });
      if (!endLocation) {
        return res.status(400).json({
          errors: [
            {
              msg: `Location with the name ${endLocationName} does not exist`,
            },
          ],
        });
      }

      let user = await User.findById(req.user.id).select("activeRide balance");
      if (user && user.activeRide && user.activeRide.bikeId) {
        return res
          .status(400)
          .json({ errors: [{ msg: `User Already has an active ride.` }] });
      }

      if (user.balance < 10) {
        return res
          .status(400)
          .json({ errors: [{ msg: `Balance less than $10` }] });
      }

      let location_updated = await CycleonLocationModel.findOneAndUpdate(
        { locationName: startLocationName },
        { $pull: { bikes: { _id: bikeId } } },
        { new: true, passRawResult: true }
      );
      if (startLocation.bikes.length == location_updated.bikes.length) {
        return res.status(400).json({
          errors: [
            {
              msg: `Bike is not at this location anymore. Please select another bike.`,
            },
          ],
        });
      }

      const bike = startLocation.bikes.find((bike) => bike._id === bikeId);
      console.log(bike);
      user = await User.findByIdAndUpdate(
        req.user.id,
        {
          activeRide: {
            startTime: Date.now(),
            bikeId: bike._id,
            description: bike.description,
            startLocation: startLocationName,
            bikeName: bike.name,
            endLocation: endLocationName,
          },
        },
        { new: true }
      ).select("-password");

      return res.send({ startLocation: location_updated, user });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route       POST /api/rides/endRide
// @desc        Allows users end rides
// @access      Private
// @parameters  NONE
router.put("/endRide", auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("activeRide");
    if (!user || !user.activeRide || !user.activeRide.bikeId) {
      return res
        .status(400)
        .json({ errors: [{ msg: `User has no active rides` }] });
    }
    let ride = user.activeRide;
    location = await CycleonLocationModel.findOneAndUpdate(
      { locationName: ride.endLocation },
      {
        $push: {
          bikes: {
            name: ride.bikeName,
            description: ride.description,
            _id: ride.bikeId,
          },
        },
      },
      { new: true, passRawResult: true }
    );
    ride.endTime = Date.now();
    ride.fare = (
      ((ride.endTime - ride.startTime) * process.env.RATE_PER_HOUR) /
      3600000
    ).toFixed(2);
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { rideHistory: ride },
        $inc: { balance: -ride.fare },
        activeRide: {
          startTime: null,
          bikeId: null,
          description: null,
          startLocation: null,
          bikeName: null,
          endLocation: null,
        },
      },
      { new: true }
    ).select("-password");

    return res.send({ endRideLocation: location, user, ride });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;

const express = require("express");
const router =  express.Router();
const {check, validationResult}  = require('express-validator');
const CycleonLocationModel = require("../../models/CycleonLocations");
const auth = require('../../middleware/auth');
const User = require("../../models/User");


// @route       POST /api/rides/bookRide
// @desc        Alloes users to book rides
// @access      Private
// @parameters  locationName(String), bikeId(String)
router.put('/bookRide',[
        check('locationName', 'Please enter a locationName with 4 or more characters').isLength({min: 4}),
        check('bikeId', 'bikeId cannot be empty').not().isEmpty(),
    ], auth, async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {locationName, bikeId} = req.body;
    try{
        let location = await CycleonLocationModel.findOne({locationName});
        if(!location){
            return res.status(400).json({errors:[{msg: `Location with the name ${locationName} does not exist`}]});
        }
        let user = await User.findById(req.user.id).select('activeRide');
        if(user && user.activeRide && user.activeRide.bikeId){
            return res.status(400).json({errors:[{msg: `User Already has an active ride.`}]});
        }
        
        let location_updated = await CycleonLocationModel.findOneAndUpdate({_location: locationName}, { $pull: { bikes: {_id: bikeId}} },  {new: true, passRawResult : true})
        if(location.bikes.length == location_updated.bikes.length){
            return res.status(400).json({errors:[{msg: `Bike is not at this location anymore. Please select another bike.`}]});
        }

        const bike = location.bikes.find(bike => bike._id === bikeId);
        user = await User.findByIdAndUpdate(req.user.id, {activeRide: {startTime: Date.now(), bikeId: bike._id, description: bike.description}}, {new: true})

        return res.send({location, user});
        
    } catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})


// @route       POST /api/rides/endRide
// @desc        Allows users end rides
// @access      Private
// @parameters  locationName(String), bikeId(String)
router.put('/endRide',[
        check('locationName', 'Please enter a locationName with 4 or more characters').isLength({min: 4}),
    ], auth, async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {locationName} = req.body;
    try{
        let location = await CycleonLocationModel.findOne({locationName});
        if(!location){
            return res.status(400).json({errors:[{msg: `Location with the name ${locationName} does not exist`}]});
        }
        let user = await User.findById(req.user.id).select('activeRide');
        if(!user || !user.activeRide || !user.activeRide.bikeId){
            return res.status(400).json({errors:[{msg: `User has no active rides`}]});
        }
        const ride = user.activeRide;
        console.log(ride)
        location = await CycleonLocationModel.findOneAndUpdate({locationName}, { $push: { bikes: {name: ride.bikeName, description: ride.bikeDescription, _id: ride.bikeId}} },  {new: true, passRawResult : true})
        ride.endTime = Date.now();
        user = await User.findByIdAndUpdate(req.user.id, {$push: {rideHistory: ride}}, {new: true})
        user = await User.findByIdAndUpdate(req.user.id, {activeRide: {startTime: null, bikeId: null, description: null}}, {new: true})

        return res.send({location, user});
        
    } catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})



module.exports = router;
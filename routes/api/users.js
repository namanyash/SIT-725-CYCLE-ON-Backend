const express = require("express");
const router =  express.Router();
const bcrypt = require('bcryptjs');
const {check, validationResult}  = require('express-validator');
const User = require("../../models/User");
const jwt = require('jsonwebtoken');
const config =  require('config');
const auth = require('../../middleware/auth');



// @route       POST /api/users/register
// @desc        Register new users with the app
// @access      Public
// @parameters  firstName(String), lastName(String), email(String), password(String), username(String), phoneNumber(Number)
router.post('/register',[
    check('firstName', 'Frist name is required').not().isEmpty(),
    check('lastName', 'Frist name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8}),
    check('username', 'Please enter a username with 4 or more characters').isLength({min: 4}),
    check('phoneNumber', 'Please enter a phone number with 10 digits').isLength(10),
    check('phoneNumber', 'Please enter a phone number with 10 digits').isLength({max: 10}),
    check('phoneNumber', 'Phone Number can only be digits').isInt({min:0}),
] ,async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {firstName, lastName, email, password, username, phoneNumber} = req.body;

    try{
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({errors:[{msg: 'Email already registered'}]});
        }

        user = await User.findOne({phoneNumber});
        if(user){
            return res.status(400).json({errors:[{msg: 'Phone Number already registered'}]});
        }

        user = await User.findOne({username});
        if(user){
            return res.status(400).json({errors:[{msg: 'Username already exists'}]});
        }

        user = new User({
            firstName,
            lastName,
            email,
            password,
            username,
            phoneNumber,
            balance: 0,
            activeRide: {startTime: null, startLocation: null, bikeName: null, bikeId: null, bikeDescription: null},
            rideHistory: []
        })

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user:{
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),{expiresIn: 3600}, (err, token)=>{
            if(err) throw err;
            return res.json({token});
        });
    } catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})

// @route       POST /api/users/loginUP
// @desc        Login users to the app using username and password
// @access      Public
// @parameters  username(String), password(String)
router.post('/loginUP',[
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8}),
    check('username', 'Please enter a username with 4 or more characters').isLength({min: 4}),
] ,async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {password, username} = req.body;

    try{
        let user = await User.findOne({username});
        if(!user){
            return res.status(400).json({errors:[{msg: 'Invalid Credentials'}]});
        }
        
        isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({errors:[{msg: 'Invalid Credentials'}]});
        }

        const payload = {
            user:{
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),{expiresIn: 3600}, (err, token)=>{
            if(err) throw err;
            return res.json({token});
        });
    } catch(err) {
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
})


// @route       GET /api/users/getUser
// @desc        Get information of a user
// @access      Private
// @parameters  
router.get('/getUser',auth,async (req,res)=> {
    const user = await User.findById(req.user.id).select('-password');
    res.send(user)
})


// @route       PUT /api/users/addBalance
// @desc        add Balance to user
// @access      Private
// @parameters  valueToAdd(Number)
router.put('/addBalance',[
    check('valueToAdd', 'No Value Provided').not().isEmpty(),
    check('valueToAdd', 'Value can only be a positive integer').isInt({min:0}),
],auth,async (req,res)=> {
     const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {valueToAdd} = req.body;
    const user = await User.findOneAndUpdate({_id: req.user.id}, { $inc: { balance: valueToAdd } },  {new: true}).select('balance');
    res.send(user)
})


// @route       PUT /api/users/withdrawBalance
// @desc        withdraw Balance to user
// @access      Private
// @parameters  valueToAdd(Number)
router.put('/withdrawBalance',[
    check('valueToSubtract', 'No Value Provided').not().isEmpty(),
    check('valueToSubtract', 'Value can only be a positive integer').isInt({min:0}),
],auth,async (req,res)=> {
     const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {valueToSubtract} = req.body;
    let user = await User.findById(req.user.id).select('balance');
    if(user.balance < valueToSubtract) {
        return res.status(400).json({errors:[{msg: `Insufficient Funds: \$${user.balance}`}]});
    }
    user = await User.findOneAndUpdate({_id: req.user.id}, { $inc: { balance: -valueToSubtract} },  {new: true}).select('balance');
    res.send(user)
})

module.exports = router;


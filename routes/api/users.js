const express = require("express");
const router =  express.Router();
const bcrypt = require('bcryptjs');
const {check, validationResult}  = require('express-validator');
const User = require("../../models/User");
const jwt = require('jsonwebtoken');
const config =  require('config');


// @route       POST /api/users
// @desc        Register new users with the app
// @access      Public
router.post('/',[
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8})
] ,async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const {name, email, password} = req.body;

    try{
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({errors:[{msg: 'User already exists'}]});
        }

        user = new User({
            name,
            email,
            password
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

module.exports = router;
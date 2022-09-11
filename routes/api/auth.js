const expres = require('express');
const router = expres.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route       GET api/auth
// @desc        ...
// @access      Private
router.get('/',auth,async (req,res)=> {
    const user = await User.findById(req.user.id).select('-password');
    res.send(user)
})

module.exports = router;
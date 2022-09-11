const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    //Get token
    const token = req.header('x-auth-token');

    if(!token) {
        return res.status(401).json({msg: 'No token access denied.'})
    }

    try{
        const decoded = jwt.verify(token, config.get('jwtSecretAdmin'));
        req.user = decoded.user;
        next();
    }catch(err) {
        return res.status(401).json({msg: 'Token is not valid'})
    }

}
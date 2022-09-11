const mongoose =  require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },    
    lastName: {
        type: String,
        required: true,
    },    
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
    },
    activeRide: {
        type: Object,
        required: true,
    },
    rideHistory: {
        type: Array,
        required: true,
    }
})

module.exports = User = mongoose.model('user', UserSchema);
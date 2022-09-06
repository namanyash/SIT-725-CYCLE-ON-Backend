require('dotenv').config()

const MongoClient = require('mongodb').MongoClient
const uri = 'mongodb+srv://namanyash:admin@sit-725-gp-db.gdz2oll.mongodb.net/?retryWrites=true&w=majority'
const client = new MongoClient(uri, {useNewUrlParser: true})


client.connect((err,db) => {
    if(!err) {
        console.log('DB Connected')
    }
    else {
        console.log("DB Connection Error: ", err);
        process.exit(1);
    }
})

module.exports = client;
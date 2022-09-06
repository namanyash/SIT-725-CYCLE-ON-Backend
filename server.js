var express = require("express");
var app = express();
var cors = require('cors')
let routes = require('./routes/projectRoutes');

app.use(express.static(__dirname+'/public'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use('/api/projects', routes)

var port = process.env.port || 3001;

app.listen(port,()=>{
    console.log("App listening to: "+port)
})

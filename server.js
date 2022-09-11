const express  = require("express");
const connectDb = require('./config/db');
const app = express();

// Connect Database
connectDb();

//Init MiddleWare
app.use(express.json({extended: false}));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server Started on port ${PORT}`)
})
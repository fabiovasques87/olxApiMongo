// import express, { Request, Response, ErrorRequestHandler } from 'express';
// import path from 'path';

require ('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileupload = require ('express-fileupload');


const apiRoutes = require('./src/routes');

mongoose.set('strictQuery', false);
//mongoose.set('useFindAndModify', false);

//conexão com banco
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
   // useFindAndModify: false,
    useUnifiedTopology: true
    
});


mongoose.Promise = global.Promise;
mongoose.connection.on('error',(error) =>{
    console.log("erro: ", error.message);
});




const server = express();

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(fileupload());

server.use(express.static(__dirname+'/public'));


server.use('/', apiRoutes);

// server.use(express.static(path.join(__dirname, '../public')));
// server.use(express.urlencoded({ extended: true }));


server.listen(process.env.PORT, ()=> {
    console.log(`Rodando no endereço: ${process.env.BASE} `);
});
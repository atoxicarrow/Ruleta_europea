const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes'); 
const connectDB = require('./utils/db'); 
const config = require('../commons/configs/site.config.js');

const app = express();
const PORT = 3042;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

app.use('/api', apiRoutes); 

app.use(express.static(path.join(__dirname, '../frontend')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en puerto ${PORT}`);
    if(config && config.DOMAIN) {
        console.log(`Dominio configurado: ${config.DOMAIN}`);
    }
});
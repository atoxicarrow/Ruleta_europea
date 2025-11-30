
const mongoose = require('mongoose');

const uri = "mongodb+srv://tavo:gustavo1103@cluster0.ztjy4ks.mongodb.net/casino_db?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Conectado exitosamente a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
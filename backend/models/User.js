const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  password: { type: String, required: true },
  fechaNacimiento: { type: Date, required: true },
  balance: { type: Number, default: 0 },
  // NUEVO: Array para guardar el historial de depósitos y retiros
  transacciones: [{
    tipo: { type: String, enum: ['deposito', 'retiro'] }, // 'deposito' o 'retiro'
    monto: Number,
    fecha: { type: Date, default: Date.now },
    descripcion: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
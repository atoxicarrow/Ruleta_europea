const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../utils/jwt'); // <--- IMPORTANTE: Importamos el middleware

// 1. OBTENER PERFIL (GET /api/user/profile)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
});

// 2. REALIZAR DEPÓSITO (POST /api/user/deposit)
router.post('/deposit', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const cantidad = parseFloat(amount);
        if (isNaN(cantidad) || cantidad <= 0) return res.status(400).json({ error: 'Monto inválido.' });

        const user = await User.findById(req.user.id);
        
        // Actualizar saldo
        user.balance += cantidad;
        
        // Guardar en historial
        user.transacciones.push({
            tipo: 'deposito',
            monto: cantidad,
            descripcion: 'Carga de saldo via Web'
        });

        await user.save();
        res.json({ message: 'Depósito exitoso', newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Error al depositar.' });
    }
});

// 3. REALIZAR RETIRO (POST /api/user/withdraw)
router.post('/withdraw', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const cantidad = parseFloat(amount);
        if (isNaN(cantidad) || cantidad <= 0) return res.status(400).json({ error: 'Monto inválido.' });

        const user = await User.findById(req.user.id);

        if (user.balance < cantidad) return res.status(400).json({ error: 'Saldo insuficiente.' });

        // Actualizar saldo
        user.balance -= cantidad;

        // Guardar en historial
        user.transacciones.push({
            tipo: 'retiro',
            monto: cantidad,
            descripcion: 'Retiro de fondos a cuenta bancaria'
        });

        await user.save();
        res.json({ message: 'Retiro exitoso', newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Error al retirar.' });
    }
});

module.exports = router;
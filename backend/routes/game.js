const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- IMPORTANTE: Importar desde los Utils ---
const { verifyToken } = require('../utils/jwt');
const { checkWin, getPayoutMultiplier } = require('../utils/payments');

// --- ENDPOINT: GIRAR LA RULETA ---
router.post('/spin', verifyToken, async (req, res) => {
    try {
        // El frontend envía un objeto { bets: [Array de apuestas] }
        const { bets } = req.body; 

        if (!bets || !Array.isArray(bets) || bets.length === 0) {
            return res.status(400).json({ error: 'No hay apuestas válidas.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // 1. Calcular apuesta total
        let totalBetAmount = 0;
        bets.forEach(b => totalBetAmount += parseFloat(b.amount));

        // 2. Verificar Saldo
        if (user.balance < totalBetAmount) {
            return res.status(400).json({ error: 'Saldo insuficiente para cubrir todas las apuestas.' });
        }

        // 3. Descontar saldo inicial (La casa toma el dinero)
        user.balance -= totalBetAmount;

        // 4. Girar Ruleta (Generar número del 0 al 36)
        const winningNumber = Math.floor(Math.random() * 37);

        // 5. Calcular ganancias
        let totalWinnings = 0;
        
        // Procesamos cada apuesta del array
        const results = bets.map(bet => {
            // Usamos la función importada de payments.js
            const isWin = checkWin(bet.type, bet.value, winningNumber);
            let winAmount = 0;
            
            if (isWin) {
                // Usamos la función importada de payments.js
                const multiplier = getPayoutMultiplier(bet.type);
                // Ganancia = Apuesta Original + (Apuesta * Multiplicador)
                winAmount = parseFloat(bet.amount) + (parseFloat(bet.amount) * multiplier);
            }
            
            totalWinnings += winAmount;
            
            return { 
                ...bet, 
                win: isWin, 
                payout: winAmount,
                desc: bet.desc || `${bet.type} ${bet.value}`
            };
        });

        // 6. Acreditar ganancias al usuario
        user.balance += totalWinnings;

        // 7. Guardar Historial en BD
        // Solo guardamos una entrada resumen por el giro completo
        user.transacciones.push({
            tipo: totalWinnings > totalBetAmount ? 'deposito' : 'retiro', // Simplificación: si ganó más de lo que apostó, cuenta como ganancia neta
            monto: Math.abs(totalWinnings - totalBetAmount), // Diferencia neta
            descripcion: `Ruleta: Salió el ${winningNumber}. Apostado: $${totalBetAmount}. Ganado: $${totalWinnings}`
        });

        await user.save();

        // 8. Responder al Frontend
        res.json({
            winningNumber,
            results,
            totalWinnings,
            newBalance: user.balance
        });

    } catch (error) {
        console.error("Error en /spin:", error);
        res.status(500).json({ error: 'Error en el servidor de juego.' });
    }
});

module.exports = router;
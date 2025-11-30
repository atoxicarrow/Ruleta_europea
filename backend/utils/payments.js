// Lógica de cálculo de ganadores y pagos

const checkWin = (betType, betValue, winningNumber) => {
    const num = parseInt(winningNumber);
    
    // 1. Número exacto
    if (betType === 'number') {
        return num === parseInt(betValue);
    }

    // Si sale 0, pierden las apuestas externas
    if (num === 0) return false;

    // 2. Colores
    const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    if (betType === 'color') {
        const isRed = REDS.includes(num);
        if (betValue === 'rojo' && isRed) return true;
        if (betValue === 'negro' && !isRed) return true;
    }

    // 3. Paridad
    if (betType === 'parity') {
        if (betValue === 'par' && num % 2 === 0) return true;
        if (betValue === 'impar' && num % 2 !== 0) return true;
    }

    // 4. Alto/Bajo
    if (betType === 'range') {
        if (betValue === 'bajo' && num >= 1 && num <= 18) return true;
        if (betValue === 'alto' && num >= 19 && num <= 36) return true;
    }

    // 5. Docenas
    if (betType === 'dozen') {
        if (betValue === '1' && num >= 1 && num <= 12) return true;
        if (betValue === '2' && num >= 13 && num <= 24) return true;
        if (betValue === '3' && num >= 25 && num <= 36) return true;
    }

    // 6. Columnas
    if (betType === 'column') {
        if (betValue === '1' && num % 3 === 1) return true;
        if (betValue === '2' && num % 3 === 2) return true;
        if (betValue === '3' && num % 3 === 0) return true;
    }

    return false;
};

const getPayoutMultiplier = (betType) => {
    switch (betType) {
        case 'number': return 35;
        case 'dozen': return 2;
        case 'column': return 2;
        default: return 1;
    }
};

module.exports = { checkWin, getPayoutMultiplier };
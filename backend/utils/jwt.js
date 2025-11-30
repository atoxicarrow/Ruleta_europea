const jwt = require('jsonwebtoken');

const JWT_SECRET = 'clave-bkn'; // En producción esto iría en variables de entorno

// Función para generar token (Usar en Login)
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '10m' } // Requisito explícito: 10 minutos
    );
};

// Middleware para proteger rutas (Usar en User y Game)
const verifyToken = (req, res, next) => {
    const token = req.cookies.token; // Requiere cookie-parser

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay sesión activa.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; 
        next(); 
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = { generateToken, verifyToken };
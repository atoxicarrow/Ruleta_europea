const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const { generateToken } = require('../utils/jwt'); // <--- IMPORTANTE: Importamos el helper

// 1. REGISTRO DE USUARIO (POST /api/auth/register)
router.post('/register', async (req, res) => {
    try {
        const { nombreCompleto, email, username, password, fechaNacimiento } = req.body;

        // A. Validar campos obligatorios
        if (!nombreCompleto || !email || !username || !password || !fechaNacimiento) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        if (edad < 18) {
            return res.status(403).json({ error: 'Debes ser mayor de 18 años para registrarte.' });
        }

        const usuarioExistente = await User.findOne({ $or: [{ email }, { username }] });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El email o nombre de usuario ya está en uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // E. Crear y guardar el usuario
        const nuevoUsuario = new User({
            nombreCompleto,
            email,
            username,
            password: passwordHash,
            fechaNacimiento,
            balance: 0 
        });

        await nuevoUsuario.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al registrar usuario.' });
    }
});

// 2. INICIO DE SESIÓN (POST /api/auth/login)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // A. Buscar usuario
        const usuario = await User.findOne({ username });
        if (!usuario) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        // B. Comparar contraseña
        const esCorrecta = await bcrypt.compare(password, usuario.password);
        if (!esCorrecta) {
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        // C. Generar Token JWT usando el helper
        const token = generateToken(usuario); // <--- ESTA LINEA FALTABA

        // D. Guardar cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, 
            sameSite: 'strict', 
            maxAge: 10 * 60 * 1000 // 10 minutos
        });

        res.json({ message: 'Inicio de sesión exitoso', username: usuario.username });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
});

// 3. CERRAR SESIÓN (POST /api/auth/logout)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada exitosamente.' });
});

module.exports = router;
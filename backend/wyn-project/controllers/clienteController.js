// controllers/clienteController.js
const express = require('express');
const Cliente = require('../models/cliente'); // Importa o modelo Cliente
const router = express.Router();

// Rota para cadastrar um novo cliente
router.post('/cadastrar', async (req, res) => {
    const { nome, email, telefone, senha, endereco } = req.body;

    try {
        const novoCliente = new Cliente({ nome, email, telefone, senha, endereco });
        await novoCliente.save(); // Salva o cliente no banco de dados
        res.status(201).json({ message: 'Cliente cadastrado com sucesso!' });
    } catch (error) {
        res.status(400).json({ error: error.message }); // Retorna erro caso ocorra
    }
});

// Rota para login de cliente
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const cliente = await Cliente.findOne({ email });
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente não encontrado!' });
        }

        const senhaValida = await cliente.validarSenha(senha);
        if (!senhaValida) {
            return res.status(401).json({ message: 'Senha incorreta!' });
        }

        res.status(200).json({ message: 'Login bem-sucedido!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

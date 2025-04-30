const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Para hashing de senhas

// Modelo de Prestador de Serviço
const prestadorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Garante que o email seja único
        lowercase: true, // Converte o email para minúsculas antes de salvar
    },
    telefone: {
        type: String,
        required: false, // Opcional
    },
    senha: {
        type: String,
        required: true, // Senha é obrigatória
    },
    especialidade: {
        type: String,
        required: false, // Opcional, mas pode ser útil para categorizar prestadores
    },
    dataCadastro: {
        type: Date,
        default: Date.now, // Define a data de cadastro como a data atual
    },
});

// Middleware para hashear a senha antes de salvar o prestador
prestadorSchema.pre('save', async function(next) {
    if (this.isModified('senha')) {
        this.senha = await bcrypt.hash(this.senha, 10); // Hash da senha com sal de 10 rounds
    }
    next();
});

// Método para verificar se a senha fornecida corresponde à senha do prestador
prestadorSchema.methods.validarSenha = async function(senha) {
    return await bcrypt.compare(senha, this.senha); // Verifica a senha com bcrypt
};

// Criação do modelo de Prestador
const Prestador = mongoose.model('Prestador', prestadorSchema);

module.exports = Prestador;

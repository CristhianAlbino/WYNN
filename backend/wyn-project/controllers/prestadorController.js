const Prestador = require('./models/Prestador');

// Função para cadastrar um novo prestador
const cadastrarPrestador = async (req, res) => {
    try {
        const { nome, email, telefone, senha, especialidade } = req.body;
        const prestadorExistente = await Prestador.findOne({ email });
        if (prestadorExistente) {
            return res.status(400).json({ message: 'Email já cadastrado.' });
        }

        const novoPrestador = new Prestador({ nome, email, telefone, senha, especialidade });
        await novoPrestador.save();

        res.status(201).json({ message: 'Cadastro de prestador realizado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao cadastrar prestador' });
    }
};

module.exports = { cadastrarPrestador };

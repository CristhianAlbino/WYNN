// backend_wyn.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = 'mongodb://127.0.0.1:27017/wyn_project';

mongoose.connect(mongoURI)
    .then(() => {
        app.listen(3000, () => {
            console.log('Conectado ao MongoDB');
            console.log('Servidor iniciado na porta 3000');
        });
    })
    .catch((err) => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno no servidor. Tente novamente mais tarde.' });
});

// Modelos
const ServicoSchema = new mongoose.Schema({
    nome_cliente: { type: String, required: true },
    email_cliente: { type: String, required: true },
    telefone_cliente: { type: String, required: true },
    endereco_servico: { type: String },
    notas_adicionais: { type: String },
    tipo_servico: { type: String, required: true },
    descricao_servico: { type: String },
    valor_servico: { type: Number },
    urgente: { type: Boolean, required: true },
    data_solicitacao: { type: Date, default: Date.now },
    status: { type: String, default: 'pendente' },
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    prestador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestador' }
});
const Servico = mongoose.model('Servico', ServicoSchema);

const UsuarioSchema = new mongoose.Schema({
    nome: String,
    email: { type: String, unique: true },
    senha: String,
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const PrestadorSchema = new mongoose.Schema({
    nome: String,
    email: { type: String, unique: true },
    senha: String,
});
const Prestador = mongoose.model('Prestador', PrestadorSchema);

// Validação Joi
const validateServico = (data) => {
    const schema = Joi.object({
        nome_cliente: Joi.string().required(),
        email_cliente: Joi.string().email().required(),
        telefone_cliente: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
        tipo_servico: Joi.string().required(),
        endereco_servico: Joi.string().allow(''),
        notas_adicionais: Joi.string().allow(''),
        descricao_servico: Joi.string().allow(''),
        valor_servico: Joi.number().allow(null),
        urgente: Joi.boolean().required(),
        usuario_id: Joi.string().optional(),
        prestador_id: Joi.string().optional()
    });
    return schema.validate(data);
};

// Autenticação
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded;

        // Verifica se o usuário ou prestador é o dono da solicitação
        const { usuario_id, prestador_id } = req.body;

        if (usuario_id && usuario_id !== req.user.id) {
            return res.status(403).json({ message: 'Acesso negado. Usuário não autorizado.' });
        }

        if (prestador_id && prestador_id !== req.user.id) {
            return res.status(403).json({ message: 'Acesso negado. Prestador não autorizado.' });
        }

        next();
    } catch (error) {
        return res.status(400).json({ message: 'Token inválido.' });
    }
};

// Rotas
app.post('/solicitar-servico', authMiddleware, async (req, res) => {
    try {
        const { error } = validateServico(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Adicionando o clienteId automaticamente com o ID do usuário logado
        const novaSolicitacao = new Servico({
            ...req.body,
            usuario_id: req.user.id, // Preenche o campo usuario_id com o ID do usuário logado
        });

        await novaSolicitacao.save();

        res.status(201).json({ message: 'Solicitação criada com sucesso!', id: novaSolicitacao._id });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ROTA PARA CLIENTE - Listar apenas os serviços do cliente logado
app.get('/meus-servicos', authMiddleware, async (req, res) => {
    try {
        const servicosDoCliente = await Servico.find({ usuario_id: req.user.id });
        res.status(200).json(servicosDoCliente);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar serviços do cliente.' });
    }
});

// ROTA PARA PRESTADOR - Ver todos os serviços
app.get('/solicitacoes-servicos', async (req, res) => {
    try {
        const solicitacoes = await Servico.find();
        res.status(200).json(solicitacoes);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao obter solicitações.', error });
    }
});

app.post('/atualizar-status-servico/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        if (!['aceito', 'recusado', 'pendente'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido.' });
        }

        const servicoAtualizado = await Servico.findByIdAndUpdate(id, { status }, { new: true });
        if (!servicoAtualizado) return res.status(404).json({ message: 'Serviço não encontrado.' });

        res.status(200).json({ message: 'Status atualizado com sucesso!', servico: servicoAtualizado });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar status.', error });
    }
});

app.delete('/deletar-servico/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        const servicoDeletado = await Servico.findByIdAndDelete(id);
        if (!servicoDeletado) return res.status(404).json({ message: 'Serviço não encontrado.' });

        res.status(200).json({ message: 'Serviço deletado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar serviço.', error });
    }
});

// Usuários
app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios!' });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
        return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        const novoUsuario = new Usuario({ nome, email, senha: senhaHash });
        await novoUsuario.save();

        res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta.' });

        const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: { _id: usuario._id, nome: usuario.nome, email: usuario.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Prestador
app.post('/login-prestador', async (req, res, next) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const prestador = await Prestador.findOne({ email });
        if (!prestador) return res.status(404).json({ message: 'Prestador não encontrado.' });

        const senhaValida = await bcrypt.compare(senha, prestador.senha);
        if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta.' });

        const token = jwt.sign({ id: prestador._id }, process.env.JWT_SECRET || 'chave_padrao', { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: { _id: prestador._id, nome: prestador.nome, email: prestador.email }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        next(error);
    }
});

app.get('/perfil', authMiddleware, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id).select('_id nome email');
        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

        res.status(200).json({ usuario });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perfil.' });
    }
});

// Exemplo com MongoDB
app.get("/api/pedidos/quantidade/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        // Contando o número de serviços solicitados pelo usuário no MongoDB
        const totalPedidos = await Servico.countDocuments({ usuario_id: userId });

        res.json({ total: totalPedidos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar a quantidade de pedidos" });
    }
});

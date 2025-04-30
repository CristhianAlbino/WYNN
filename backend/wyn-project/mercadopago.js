const mercadopago = require('mercadopago');

// Configurar Mercado Pago com o Access Token
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN
});

// Criar pagamento
async function createPayment(req, res) {
    try {
        const { title, quantity, price } = req.body;

        const preference = {
            items: [{
                title,
                quantity,
                currency_id: "BRL",
                unit_price: parseFloat(price)
            }],
            back_urls: {
                success: "https://www.seusite.com/sucesso",
                failure: "https://www.seusite.com/falha",
                pending: "https://www.seusite.com/pendente"
            },
            auto_return: "approved"
        };

        const response = await mercadopago.preferences.create(preference);
        return res.json({ link: response.body.init_point });

    } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        return res.status(500).json({ error: "Erro ao processar pagamento." });
    }
}

module.exports = { createPayment };

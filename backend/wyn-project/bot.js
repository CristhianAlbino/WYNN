require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post("/whatsapp", (req, res) => {
    const message = req.body.Body.toLowerCase();
    const sender = req.body.From;

    let responseMessage = "Olá! Como posso te ajudar no WYN?";

    if (message.includes("preço")) {
        responseMessage = "Os preços variam de acordo com o prestador. Qual serviço você precisa?";
    } else if (message.includes("agendar")) {
        responseMessage = "Para agendar um serviço, acesse nosso site e escolha um prestador!";
    } else if (message.includes("serviço")) {
        responseMessage = "Que tipo de serviço você está procurando? Temos diversas opções!";
    } else if (message.includes("ajuda")) {
        responseMessage = "Em que posso te ajudar? Digite 'preço' ou 'agendar' para começar.";
    }

    client.messages
        .create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: sender,
            body: responseMessage,
        })
        .then(() => console.log("Mensagem enviada"))
        .catch((err) => console.error("Erro ao enviar mensagem:", err));

    res.sendStatus(200);
});

app.listen(3000, () => console.log("Bot do WhatsApp rodando na porta 3000"));


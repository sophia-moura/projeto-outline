require("dotenv").config({ quiet: true });

const express = require("express");
const path = require("path");
const rotasApi = require("./routes/api");

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", rotasApi);

app.use("/api", (req, res) => {
    res.status(404).json({ erro: "Rota não encontrada." });
});

app.use((erro, req, res, next) => {
    if (erro.type === "entity.parse.failed") {
        return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
    }

    console.error(erro);
    res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});

const express = require("express");
const { carregarUsuario } = require("../middleware/autenticacao");
const rotasAuth = require("./auth");
const rotasProdutos = require("./produtos");
const rotasPedidos = require("./pedidos");
const rotasEstoque = require("./estoque");

const router = express.Router();

router.use(carregarUsuario);

router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

router.use("/auth", rotasAuth);
router.use("/pedidos", rotasPedidos);
router.use("/estoque", rotasEstoque);
router.use(rotasProdutos);

module.exports = router;

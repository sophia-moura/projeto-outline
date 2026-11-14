const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { SESSAO_DIAS } = require("../utils/regras");
const { textoValido, emailValido } = require("../utils/validacao");
const { gerarHashToken, exigirLogin } = require("../middleware/autenticacao");

const router = express.Router();

const criarSessao = async usuarioId => {
    const token = crypto.randomBytes(32).toString("hex");

    await db.query(
        `INSERT INTO sessoes (usuario_id, token_hash, expira_em)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
        [usuarioId, gerarHashToken(token), SESSAO_DIAS]
    );

    return token;
};

router.post("/cadastro", async (req, res) => {
    const { nome, email, senha, confirmarSenha } = req.body || {};

    if (!textoValido(nome, 2, 120)) {
        return res.status(400).json({ erro: "Informe seu nome completo." });
    }

    if (!emailValido(email) || email.trim().length > 150) {
        return res.status(400).json({ erro: "Informe um e-mail válido." });
    }

    if (typeof senha !== "string" || senha.length < 6 || senha.length > 72) {
        return res.status(400).json({ erro: "A senha deve ter entre 6 e 72 caracteres." });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({ erro: "As senhas não coincidem." });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(senha, 10);

    let usuarioId;

    try {
        const [resultado] = await db.query(
            "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, 'cliente')",
            [nome.trim(), emailNormalizado, senhaHash]
        );

        usuarioId = resultado.insertId;
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Já existe uma conta com este e-mail." });
        }

        throw erro;
    }

    const token = await criarSessao(usuarioId);

    res.status(201).json({
        usuario: { id: usuarioId, nome: nome.trim(), email: emailNormalizado, perfil: "cliente" },
        token
    });
});

router.post("/login", async (req, res) => {
    const { email, senha } = req.body || {};

    if (!emailValido(email) || typeof senha !== "string" || senha === "") {
        return res.status(400).json({ erro: "Informe e-mail e senha." });
    }

    const [usuarios] = await db.query(
        "SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = ?",
        [email.trim().toLowerCase()]
    );

    const usuario = usuarios[0];
    const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;

    if (!senhaCorreta) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }

    await db.query("DELETE FROM sessoes WHERE expira_em < NOW()");

    const token = await criarSessao(usuario.id);

    res.json({
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
        token
    });
});

router.post("/logout", exigirLogin, async (req, res) => {
    await db.query("DELETE FROM sessoes WHERE token_hash = ?", [gerarHashToken(req.token)]);

    res.json({ mensagem: "Sessão encerrada com sucesso." });
});

router.get("/me", exigirLogin, (req, res) => {
    res.json({ usuario: req.usuario });
});

module.exports = router;

const crypto = require("crypto");
const db = require("../db");

const gerarHashToken = token =>
    crypto.createHash("sha256").update(token).digest("hex");

const carregarUsuario = async (req, res, next) => {
    req.usuario = null;
    req.token = null;

    const [tipo, token] = (req.headers.authorization || "").split(" ");

    if (tipo !== "Bearer" || !token) {
        return next();
    }

    const [linhas] = await db.query(
        `SELECT u.id, u.nome, u.email, u.perfil
         FROM sessoes s
         JOIN usuarios u ON u.id = s.usuario_id
         WHERE s.token_hash = ? AND s.expira_em > NOW()`,
        [gerarHashToken(token)]
    );

    if (linhas.length > 0) {
        req.usuario = linhas[0];
        req.token = token;
    }

    next();
};

const exigirLogin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ erro: "É necessário fazer login para continuar." });
    }

    next();
};

const exigirAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ erro: "É necessário fazer login para continuar." });
    }

    if (req.usuario.perfil !== "admin") {
        return res.status(403).json({ erro: "Acesso restrito a administradores." });
    }

    next();
};

module.exports = { gerarHashToken, carregarUsuario, exigirLogin, exigirAdmin };

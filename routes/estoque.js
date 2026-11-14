const express = require("express");
const db = require("../db");
const { exigirAdmin } = require("../middleware/autenticacao");
const {
    MOVIMENTACOES_LIMITE_PADRAO,
    MOVIMENTACOES_LIMITE_MAXIMO
} = require("../utils/regras");
const {
    ErroNegocio,
    textoValido,
    codigoValido,
    inteiroNaoNegativo,
    inteiroPositivo,
    responderErroNegocio
} = require("../utils/validacao");

const router = express.Router();

const TIPOS = ["entrada", "saida", "ajuste"];
const LIMITE_QUANTIDADE = 1000000;

const classificarEstoque = (estoque, minimo) => {
    if (estoque === 0) {
        return "esgotado";
    }

    return estoque <= minimo ? "baixo" : "normal";
};

router.use(exigirAdmin);

router.get("/", async (req, res) => {
    const [produtos] = await db.query(
        `SELECT p.codigo, p.nome, c.slug AS categoria, p.estoque, p.estoque_minimo, p.ativo
         FROM produtos p
         JOIN categorias c ON c.id = p.categoria_id
         ORDER BY p.codigo`
    );

    res.json(produtos.map(produto => ({
        ...produto,
        ativo: Boolean(produto.ativo),
        situacao: classificarEstoque(produto.estoque, produto.estoque_minimo)
    })));
});

router.post("/movimentacoes", async (req, res) => {
    const { codigo, tipo, quantidade, saldo, motivo } = req.body || {};

    if (!codigoValido(codigo)) {
        return res.status(400).json({ erro: "Informe o código do produto." });
    }

    if (!TIPOS.includes(tipo)) {
        return res.status(400).json({ erro: "Tipo inválido. Use entrada, saida ou ajuste." });
    }

    if (motivo !== undefined && !textoValido(motivo, 1, 255)) {
        return res.status(400).json({ erro: "Motivo inválido (até 255 caracteres)." });
    }

    if (tipo !== "entrada" && motivo === undefined) {
        return res.status(400).json({ erro: "Informe o motivo da movimentação." });
    }

    if (tipo === "ajuste") {
        if (!inteiroNaoNegativo(saldo) || saldo > LIMITE_QUANTIDADE) {
            return res.status(400).json({ erro: "Informe o saldo correto em saldo (inteiro maior ou igual a zero)." });
        }
    } else if (!inteiroPositivo(quantidade) || quantidade > LIMITE_QUANTIDADE) {
        return res.status(400).json({ erro: "Quantidade inválida. Informe um número inteiro maior que zero." });
    }

    const conexao = await db.getConnection();
    let movimentacao;
    let produtoAtualizado;

    try {
        await conexao.beginTransaction();

        const [produtos] = await conexao.query(
            "SELECT id, codigo, nome, estoque FROM produtos WHERE codigo = ? FOR UPDATE",
            [codigo]
        );

        if (produtos.length === 0) {
            throw new ErroNegocio(404, "Produto não encontrado.");
        }

        const produto = produtos[0];
        let novoSaldo;
        let quantidadeRegistrada;

        if (tipo === "entrada") {
            novoSaldo = produto.estoque + quantidade;
            quantidadeRegistrada = quantidade;
        } else if (tipo === "saida") {
            novoSaldo = produto.estoque - quantidade;
            quantidadeRegistrada = quantidade;

            if (novoSaldo < 0) {
                throw new ErroNegocio(
                    409,
                    `Saldo insuficiente. Estoque atual: ${produto.estoque}.`
                );
            }
        } else {
            novoSaldo = saldo;
            quantidadeRegistrada = Math.abs(saldo - produto.estoque);

            if (quantidadeRegistrada === 0) {
                throw new ErroNegocio(400, "O saldo informado é igual ao saldo atual. Nenhum ajuste necessário.");
            }
        }

        await conexao.query("UPDATE produtos SET estoque = ? WHERE id = ?", [novoSaldo, produto.id]);

        const [resultado] = await conexao.query(
            `INSERT INTO movimentacoes_estoque
                (produto_id, tipo, quantidade, saldo_anterior, saldo_resultante, motivo, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                produto.id,
                tipo,
                quantidadeRegistrada,
                produto.estoque,
                novoSaldo,
                motivo === undefined ? "Reposição de estoque" : motivo.trim(),
                req.usuario.id
            ]
        );

        movimentacao = {
            id: resultado.insertId,
            codigo: produto.codigo,
            tipo,
            quantidade: quantidadeRegistrada,
            saldo_anterior: produto.estoque,
            saldo_resultante: novoSaldo
        };

        produtoAtualizado = { codigo: produto.codigo, nome: produto.nome, estoque: novoSaldo };

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();

        if (erro instanceof ErroNegocio) {
            return responderErroNegocio(res, erro);
        }

        throw erro;
    } finally {
        conexao.release();
    }

    res.status(201).json({
        mensagem: "Movimentação registrada com sucesso.",
        movimentacao,
        produto: produtoAtualizado
    });
});

router.get("/movimentacoes", async (req, res) => {
    const { codigo, tipo, limite } = req.query;

    let sql = `
        SELECT m.id, m.criado_em AS data, p.codigo, p.nome AS produto, m.tipo, m.quantidade,
               m.saldo_anterior, m.saldo_resultante, m.motivo,
               u.nome AS usuario, m.pedido_id
        FROM movimentacoes_estoque m
        JOIN produtos p ON p.id = m.produto_id
        LEFT JOIN usuarios u ON u.id = m.usuario_id
        WHERE 1 = 1
    `;
    const parametros = [];

    if (tipo !== undefined) {
        if (!TIPOS.includes(tipo)) {
            return res.status(400).json({ erro: "Tipo inválido. Use entrada, saida ou ajuste." });
        }

        sql += " AND m.tipo = ?";
        parametros.push(tipo);
    }

    if (codigo !== undefined) {
        sql += " AND p.codigo = ?";
        parametros.push(codigo);
    }

    let limiteConsulta = MOVIMENTACOES_LIMITE_PADRAO;

    if (limite !== undefined) {
        if (!/^\d+$/.test(limite) || Number(limite) < 1) {
            return res.status(400).json({ erro: "Limite inválido." });
        }

        limiteConsulta = Math.min(Number(limite), MOVIMENTACOES_LIMITE_MAXIMO);
    }

    sql += " ORDER BY m.id DESC LIMIT ?";
    parametros.push(limiteConsulta);

    const [movimentacoes] = await db.query(sql, parametros);

    res.json(movimentacoes);
});

module.exports = router;

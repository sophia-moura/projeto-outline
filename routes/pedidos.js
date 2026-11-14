const express = require("express");
const db = require("../db");
const { exigirLogin } = require("../middleware/autenticacao");
const {
    DESCONTO_VALOR_MINIMO_CENTAVOS,
    DESCONTO_PERCENTUAL
} = require("../utils/regras");
const {
    ErroNegocio,
    paraCentavos,
    paraReais,
    responderErroNegocio
} = require("../utils/validacao");

const router = express.Router();

const calcularDescontoCentavos = subtotalCentavos => {
    if (subtotalCentavos >= DESCONTO_VALOR_MINIMO_CENTAVOS) {
        return Math.round(subtotalCentavos * DESCONTO_PERCENTUAL / 100);
    }

    return 0;
};

const carregarPedidos = async (condicao, parametros) => {
    const [pedidos] = await db.query(
        `SELECT p.id, p.criado_em AS data, p.situacao, p.subtotal, p.desconto, p.valor_final,
                u.id AS cliente_id, u.nome AS cliente_nome
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         ${condicao}
         ORDER BY p.id DESC`,
        parametros
    );

    if (pedidos.length === 0) {
        return [];
    }

    const [itens] = await db.query(
        `SELECT i.pedido_id, pr.codigo, i.nome_produto AS nome, i.quantidade, i.preco_unitario
         FROM itens_pedido i
         JOIN produtos pr ON pr.id = i.produto_id
         WHERE i.pedido_id IN (?)
         ORDER BY i.id`,
        [pedidos.map(pedido => pedido.id)]
    );

    return pedidos.map(pedido => ({
        id: pedido.id,
        data: pedido.data,
        situacao: pedido.situacao,
        subtotal: pedido.subtotal,
        desconto: pedido.desconto,
        valor_final: pedido.valor_final,
        cliente: { id: pedido.cliente_id, nome: pedido.cliente_nome },
        itens: itens
            .filter(item => item.pedido_id === pedido.id)
            .map(item => ({
                codigo: item.codigo,
                nome: item.nome,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: paraReais(paraCentavos(item.preco_unitario) * item.quantidade)
            }))
    }));
};

router.post("/", exigirLogin, async (req, res) => {
    const itensRecebidos = req.body && req.body.itens;

    if (!Array.isArray(itensRecebidos) || itensRecebidos.length === 0) {
        return res.status(400).json({ erro: "O carrinho está vazio. Adicione produtos para finalizar a compra." });
    }

    const quantidadesPedidas = new Map();

    for (const item of itensRecebidos) {
        const itemValido = item
            && typeof item.codigo === "string"
            && Number.isInteger(item.quantidade)
            && item.quantidade > 0;

        if (!itemValido) {
            return res.status(400).json({
                erro: "Cada item deve ter o código do produto e uma quantidade inteira maior que zero."
            });
        }

        quantidadesPedidas.set(
            item.codigo,
            (quantidadesPedidas.get(item.codigo) || 0) + item.quantidade
        );
    }

    const conexao = await db.getConnection();
    let pedidoId;

    try {
        await conexao.beginTransaction();

        const [produtos] = await conexao.query(
            `SELECT id, codigo, nome, preco, estoque
             FROM produtos
             WHERE codigo IN (?) AND ativo = 1
             ORDER BY id
             FOR UPDATE`,
            [[...quantidadesPedidas.keys()]]
        );

        const encontrados = new Set(produtos.map(produto => produto.codigo));
        const inexistentes = [...quantidadesPedidas.keys()].filter(codigo => !encontrados.has(codigo));

        if (inexistentes.length > 0) {
            throw new ErroNegocio(
                404,
                "Um ou mais produtos não existem ou estão indisponíveis.",
                inexistentes.map(codigo => ({ codigo, motivo: "Produto inexistente ou indisponível." }))
            );
        }

        const semEstoque = produtos
            .filter(produto => produto.estoque < quantidadesPedidas.get(produto.codigo))
            .map(produto => ({
                codigo: produto.codigo,
                nome: produto.nome,
                solicitado: quantidadesPedidas.get(produto.codigo),
                disponivel: produto.estoque,
                motivo: "Estoque insuficiente."
            }));

        if (semEstoque.length > 0) {
            throw new ErroNegocio(
                409,
                "Estoque insuficiente para um ou mais produtos.",
                semEstoque
            );
        }

        let subtotalCentavos = 0;

        for (const produto of produtos) {
            subtotalCentavos += paraCentavos(produto.preco) * quantidadesPedidas.get(produto.codigo);
        }

        const descontoCentavos = calcularDescontoCentavos(subtotalCentavos);
        const valorFinalCentavos = subtotalCentavos - descontoCentavos;

        const [resultadoPedido] = await conexao.query(
            `INSERT INTO pedidos (usuario_id, subtotal, desconto, valor_final, situacao)
             VALUES (?, ?, ?, ?, 'Concluído')`,
            [
                req.usuario.id,
                paraReais(subtotalCentavos),
                paraReais(descontoCentavos),
                paraReais(valorFinalCentavos)
            ]
        );

        pedidoId = resultadoPedido.insertId;

        for (const produto of produtos) {
            const quantidade = quantidadesPedidas.get(produto.codigo);
            const saldoResultante = produto.estoque - quantidade;

            await conexao.query(
                `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario)
                 VALUES (?, ?, ?, ?, ?)`,
                [pedidoId, produto.id, produto.nome, quantidade, produto.preco]
            );

            const [baixa] = await conexao.query(
                "UPDATE produtos SET estoque = estoque - ? WHERE id = ? AND estoque >= ?",
                [quantidade, produto.id, quantidade]
            );

            if (baixa.affectedRows !== 1) {
                throw new ErroNegocio(409, "Estoque insuficiente para concluir o pedido.");
            }

            await conexao.query(
                `INSERT INTO movimentacoes_estoque
                    (produto_id, tipo, quantidade, saldo_anterior, saldo_resultante, motivo, usuario_id, pedido_id)
                 VALUES (?, 'saida', ?, ?, ?, ?, ?, ?)`,
                [
                    produto.id,
                    quantidade,
                    produto.estoque,
                    saldoResultante,
                    `Venda - pedido #${pedidoId}`,
                    req.usuario.id,
                    pedidoId
                ]
            );
        }

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

    const [pedido] = await carregarPedidos("WHERE p.id = ?", [pedidoId]);

    res.status(201).json({
        mensagem: `Pedido #${pedidoId} realizado com sucesso.`,
        pedido
    });
});

router.get("/", exigirLogin, async (req, res) => {
    if (req.usuario.perfil === "admin") {
        return res.json(await carregarPedidos("", []));
    }

    res.json(await carregarPedidos("WHERE p.usuario_id = ?", [req.usuario.id]));
});

router.get("/:id", exigirLogin, async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({ erro: "Número de pedido inválido." });
    }

    const [pedido] = await carregarPedidos("WHERE p.id = ?", [Number(req.params.id)]);

    if (!pedido) {
        return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    if (req.usuario.perfil !== "admin" && pedido.cliente.id !== req.usuario.id) {
        return res.status(403).json({ erro: "Você não tem permissão para consultar este pedido." });
    }

    res.json(pedido);
});

module.exports = router;

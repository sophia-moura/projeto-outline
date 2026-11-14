const express = require("express");
const db = require("../db");
const { exigirAdmin } = require("../middleware/autenticacao");
const {
    textoValido,
    codigoValido,
    inteiroNaoNegativo,
    precoValido
} = require("../utils/validacao");

const router = express.Router();

const SQL_PRODUTOS = `
    SELECT p.codigo, p.nome, c.slug AS categoria, c.nome AS categoria_nome,
           p.preco, p.estoque, p.estoque_minimo, p.imagem, p.ativo
    FROM produtos p
    JOIN categorias c ON c.id = p.categoria_id
`;

const LIMITE_ESTOQUE = 1000000;

const formatarProduto = linha => ({ ...linha, ativo: Boolean(linha.ativo) });

const buscarProduto = async codigo => {
    const [linhas] = await db.query(SQL_PRODUTOS + " WHERE p.codigo = ?", [codigo]);

    return linhas.length > 0 ? formatarProduto(linhas[0]) : null;
};

const buscarIdCategoria = async slug => {
    const [linhas] = await db.query("SELECT id FROM categorias WHERE slug = ?", [slug]);

    return linhas.length > 0 ? linhas[0].id : null;
};

router.get("/categorias", async (req, res) => {
    const [categorias] = await db.query("SELECT slug, nome FROM categorias ORDER BY nome");

    res.json(categorias);
});

router.get("/produtos", async (req, res) => {
    const { busca, categoria, todos } = req.query;

    if (todos === "1") {
        if (!req.usuario) {
            return res.status(401).json({ erro: "É necessário fazer login para continuar." });
        }

        if (req.usuario.perfil !== "admin") {
            return res.status(403).json({ erro: "Acesso restrito a administradores." });
        }
    }

    let sql = SQL_PRODUTOS + " WHERE 1 = 1";
    const parametros = [];

    if (todos !== "1") {
        sql += " AND p.ativo = 1";
    }

    if (typeof categoria === "string" && categoria !== "" && categoria !== "todos") {
        sql += " AND c.slug = ?";
        parametros.push(categoria);
    }

    if (typeof busca === "string" && busca.trim() !== "") {
        sql += " AND p.nome LIKE ?";
        parametros.push(`%${busca.trim()}%`);
    }

    sql += " ORDER BY p.codigo";

    const [produtos] = await db.query(sql, parametros);

    res.json(produtos.map(formatarProduto));
});

router.get("/produtos/:codigo", async (req, res) => {
    const produto = await buscarProduto(req.params.codigo);
    const ehAdmin = req.usuario && req.usuario.perfil === "admin";

    if (!produto || (!produto.ativo && !ehAdmin)) {
        return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json(produto);
});

router.post("/produtos", exigirAdmin, async (req, res) => {
    const { codigo, nome, categoria, preco, estoque, estoque_minimo, imagem } = req.body || {};
    const minimo = estoque_minimo === undefined ? 5 : estoque_minimo;

    if (!codigoValido(codigo)) {
        return res.status(400).json({ erro: "Código inválido. Use letras, números e hífen (até 20 caracteres)." });
    }

    if (!textoValido(nome, 2, 120)) {
        return res.status(400).json({ erro: "Informe o nome do produto (2 a 120 caracteres)." });
    }

    if (!precoValido(preco)) {
        return res.status(400).json({ erro: "Preço inválido. Informe um número maior que zero com até 2 casas decimais." });
    }

    if (!inteiroNaoNegativo(estoque) || estoque > LIMITE_ESTOQUE) {
        return res.status(400).json({ erro: "Estoque inicial inválido. Informe um número inteiro maior ou igual a zero." });
    }

    if (!inteiroNaoNegativo(minimo) || minimo > LIMITE_ESTOQUE) {
        return res.status(400).json({ erro: "Estoque mínimo inválido." });
    }

    if (!textoValido(imagem, 1, 255)) {
        return res.status(400).json({ erro: "Informe o caminho da imagem do produto." });
    }

    const categoriaId = typeof categoria === "string" ? await buscarIdCategoria(categoria) : null;

    if (!categoriaId) {
        return res.status(400).json({ erro: "Categoria inexistente." });
    }

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        const [resultado] = await conexao.query(
            `INSERT INTO produtos (codigo, nome, categoria_id, preco, estoque, estoque_minimo, imagem)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nome.trim(), categoriaId, preco, estoque, minimo, imagem.trim()]
        );

        if (estoque > 0) {
            await conexao.query(
                `INSERT INTO movimentacoes_estoque
                    (produto_id, tipo, quantidade, saldo_anterior, saldo_resultante, motivo, usuario_id)
                 VALUES (?, 'entrada', ?, 0, ?, 'Estoque inicial', ?)`,
                [resultado.insertId, estoque, estoque, req.usuario.id]
            );
        }

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();

        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Já existe um produto com este código." });
        }

        throw erro;
    } finally {
        conexao.release();
    }

    res.status(201).json(await buscarProduto(codigo));
});

router.put("/produtos/:codigo", exigirAdmin, async (req, res) => {
    const corpo = req.body || {};
    const campos = [];
    const valores = [];

    if (corpo.estoque !== undefined) {
        return res.status(400).json({
            erro: "O estoque só pode ser alterado por movimentações. Use POST /api/estoque/movimentacoes."
        });
    }

    if (corpo.nome !== undefined) {
        if (!textoValido(corpo.nome, 2, 120)) {
            return res.status(400).json({ erro: "Nome inválido (2 a 120 caracteres)." });
        }

        campos.push("nome = ?");
        valores.push(corpo.nome.trim());
    }

    if (corpo.preco !== undefined) {
        if (!precoValido(corpo.preco)) {
            return res.status(400).json({ erro: "Preço inválido. Informe um número maior que zero com até 2 casas decimais." });
        }

        campos.push("preco = ?");
        valores.push(corpo.preco);
    }

    if (corpo.imagem !== undefined) {
        if (!textoValido(corpo.imagem, 1, 255)) {
            return res.status(400).json({ erro: "Imagem inválida." });
        }

        campos.push("imagem = ?");
        valores.push(corpo.imagem.trim());
    }

    if (corpo.estoque_minimo !== undefined) {
        if (!inteiroNaoNegativo(corpo.estoque_minimo) || corpo.estoque_minimo > LIMITE_ESTOQUE) {
            return res.status(400).json({ erro: "Estoque mínimo inválido." });
        }

        campos.push("estoque_minimo = ?");
        valores.push(corpo.estoque_minimo);
    }

    if (corpo.ativo !== undefined) {
        if (typeof corpo.ativo !== "boolean") {
            return res.status(400).json({ erro: "O campo ativo deve ser true ou false." });
        }

        campos.push("ativo = ?");
        valores.push(corpo.ativo ? 1 : 0);
    }

    if (corpo.categoria !== undefined) {
        const categoriaId = typeof corpo.categoria === "string"
            ? await buscarIdCategoria(corpo.categoria)
            : null;

        if (!categoriaId) {
            return res.status(400).json({ erro: "Categoria inexistente." });
        }

        campos.push("categoria_id = ?");
        valores.push(categoriaId);
    }

    if (campos.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo válido para atualizar." });
    }

    const [resultado] = await db.query(
        `UPDATE produtos SET ${campos.join(", ")} WHERE codigo = ?`,
        [...valores, req.params.codigo]
    );

    if (resultado.affectedRows === 0) {
        return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json(await buscarProduto(req.params.codigo));
});

router.delete("/produtos/:codigo", exigirAdmin, async (req, res) => {
    const [resultado] = await db.query(
        "UPDATE produtos SET ativo = 0 WHERE codigo = ?",
        [req.params.codigo]
    );

    if (resultado.affectedRows === 0) {
        return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json({ mensagem: "Produto desativado com sucesso." });
});

module.exports = router;

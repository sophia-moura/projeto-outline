const express = require("express");
const db = require("./database");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 3000;

// Permite receber dados em JSON
app.use(express.json());

// Configuração da sessão do usuário
app.use(session({
    name: "outline.sid",
    secret: process.env.SESSION_SECRET || "outline-chave-secreta-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 2 * 60 * 60 * 1000
    }
}));

// Permite acessar os arquivos do projeto
app.use(express.static(__dirname));

// Cria uma sessão para o usuário autenticado
function iniciarSessao(req, usuario) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((erro) => {
            if (erro) {
                return reject(erro);
            }

            req.session.usuario = usuario;

            req.session.save((erroSalvar) => {
                if (erroSalvar) {
                    return reject(erroSalvar);
                }

                resolve();
            });
        });
    });
}


// ======================================
// CADASTRO DE USUÁRIO
// ======================================

app.post("/api/cadastro", async (req, res) => {
    try {
        const nome = typeof req.body?.nome === "string"
            ? req.body.nome.trim()
            : "";

        const email = typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        const senha = typeof req.body?.senha === "string"
            ? req.body.senha
            : "";

        // Validação dos campos
        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                mensagem: "Informe um e-mail válido."
            });
        }

        if (senha.length < 6 || senha.length > 72) {
            return res.status(400).json({
                mensagem: "A senha deve ter entre 6 e 72 caracteres."
            });
        }

        // Verifica se o e-mail já está cadastrado
        const usuarioExistente = db.prepare(
            "SELECT id FROM usuarios WHERE email = ?"
        ).get(email);

        if (usuarioExistente) {
            return res.status(409).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        // Protege a senha antes de armazená-la
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        // Salva o usuário no banco de dados
        db.prepare(`
            INSERT INTO usuarios (nome, email, senha)
            VALUES (?, ?, ?)
        `).run(nome, email, senhaCriptografada);

        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso!"
        });

    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        if (erro.code?.startsWith("SQLITE_CONSTRAINT")) {
            return res.status(409).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        res.status(500).json({
            mensagem: "Erro ao realizar cadastro."
        });
    }
});


// ======================================
// LOGIN
// ======================================

app.post("/api/login", async (req, res) => {
    try {
        const email = typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        const senha = typeof req.body?.senha === "string"
            ? req.body.senha
            : "";

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "Informe o e-mail e a senha."
            });
        }

        // Procura o usuário no banco
        const usuario = db.prepare(`
            SELECT id, nome, email, senha
            FROM usuarios
            WHERE email = ?
        `).get(email);

        if (!usuario) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }

        // Compara a senha informada com a senha protegida
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }

        // Inicia a sessão do usuário
        await iniciarSessao(req, {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        });

        res.json({
            mensagem: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (erro) {
        console.error("Erro no login:", erro);

        res.status(500).json({
            mensagem: "Erro ao realizar login."
        });
    }
});


// ======================================
// IDENTIFICAÇÃO DO USUÁRIO AUTENTICADO
// ======================================

app.get("/api/usuario", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            mensagem: "Nenhum usuário autenticado."
        });
    }

    res.json({
        usuario: req.session.usuario
    });
});


// ======================================
// LOGOUT
// ======================================

app.post("/api/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao sair:", erro);

            return res.status(500).json({
                mensagem: "Erro ao encerrar a sessão."
            });
        }

        res.clearCookie("outline.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        });

        res.json({
            mensagem: "Logout realizado com sucesso!"
        });
    });
});


// ======================================
// LISTAR TODOS OS PRODUTOS
// ======================================

app.get("/api/produtos", (req, res) => {
    try {
        const produtos = db.prepare(
            "SELECT * FROM produtos"
        ).all();

        res.json(produtos);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao buscar produtos."
        });
    }
});


// ======================================
// BUSCAR PRODUTO PELO CÓDIGO
// ======================================

app.get("/api/produtos/:codigo", (req, res) => {
    try {
        const produto = db.prepare(
            "SELECT * FROM produtos WHERE codigo = ?"
        ).get(req.params.codigo);

        if (!produto) {
            return res.status(404).json({
                mensagem: "Produto não encontrado."
            });
        }

        res.json(produto);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao buscar produto."
        });
    }
});


// ======================================
// FINALIZAR COMPRA E ATUALIZAR ESTOQUE
// ======================================

app.post("/api/compras", (req, res) => {
    try {
        const { itens } = req.body;

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({
                mensagem: "O carrinho está vazio."
            });
        }

        const finalizarCompra = db.transaction(() => {
            const buscarProduto = db.prepare(
                "SELECT * FROM produtos WHERE codigo = ?"
            );

            const atualizarEstoque = db.prepare(`
                UPDATE produtos
                SET estoque = estoque - ?
                WHERE codigo = ? AND estoque >= ?
            `);

            for (const item of itens) {
                if (
                    !item.codigo ||
                    !Number.isInteger(item.quantidade) ||
                    item.quantidade <= 0
                ) {
                    throw new Error("Dados de produto inválidos.");
                }

                const produto = buscarProduto.get(item.codigo);

                if (!produto) {
                    throw new Error(
                        `Produto ${item.codigo} não encontrado.`
                    );
                }

                if (produto.estoque < item.quantidade) {
                    throw new Error(
                        `Estoque insuficiente para ${produto.nome}.`
                    );
                }

                const resultado = atualizarEstoque.run(
                    item.quantidade,
                    item.codigo,
                    item.quantidade
                );

                if (resultado.changes === 0) {
                    throw new Error(
                        `Não foi possível atualizar o estoque de ${produto.nome}.`
                    );
                }
            }
        });

        finalizarCompra();

        res.json({
            mensagem: "Compra finalizada com sucesso!"
        });

    } catch (erro) {
        console.error("Erro na compra:", erro);

        res.status(400).json({
            mensagem: erro.message
        });
    }
});


// ======================================
// INICIAR SERVIDOR
// ======================================

app.listen(PORT, () => {
    console.log(
        `Servidor Outline rodando em http://localhost:${PORT}`
    );
});
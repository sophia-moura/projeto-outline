

const Database = require("better-sqlite3");

// Cria ou abre o banco de dados da Outline
const db = new Database("outline.db");

// ======================================
// TABELA DE PRODUTOS
// ======================================

db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
        codigo TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        preco REAL NOT NULL,
        estoque INTEGER NOT NULL,
        imagem TEXT NOT NULL
    )
`);

// ======================================
// TABELA DE USUÁRIOS
// ======================================

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL
    )
`);

// ======================================
// CADASTRO DOS PRODUTOS INICIAIS
// ======================================

const inserirProduto = db.prepare(`
    INSERT OR IGNORE INTO produtos
    (codigo, nome, categoria, preco, estoque, imagem)
    VALUES (?, ?, ?, ?, ?, ?)
`);

// Produtos iniciais da loja Outline
const produtosIniciais = [
    ["OUT-001", "Mochila Vinho", "mochilas", 500.00, 10, "/imagens/jpeg/produto-mochila-vinho.jpeg"],
    ["OUT-002", "Caderno Azul", "cadernos", 39.90, 15, "/imagens/jpeg/produto-caderno-azul.jpeg"],
    ["OUT-003", "Kit de Canetas Coloridas", "canetas", 29.90, 20, "/imagens/jpeg/produto-canetas-coloridas.jpeg"],
    ["OUT-004", "Chaveiros", "chaveiros", 19.90, 25, "/imagens/jpeg/produto-chaveiros.jpeg"],
    ["OUT-005", "Estojo Preto", "estojos", 59.90, 10, "/imagens/jpeg/produto-estojo-preto.jpeg"],
    ["OUT-006", "Kit de Lápis de Cor", "lapis", 50.00, 50, "/imagens/jpeg/produto-lapis-de-cor.jpeg"],
    ["OUT-007", "Mochila Azul", "mochilas", 349.90, 0, "/imagens/jpeg/produto-mochila-azul.jpeg"],
    ["OUT-008", "Necessaire Rosa", "necessaires", 69.90, 20, "/imagens/jpeg/produto-necessaire-rosa.jpeg"],
    ["OUT-009", "Kit de Necessaires", "necessaires", 89.90, 10, "/imagens/jpeg/produto-necessaires.jpeg"],
    ["OUT-010", "Mochila Preta", "mochilas", 399.90, 10, "/imagens/jpeg/produto-mochila-preta.jpeg"]
];

// Cadastra os produtos sem duplicar os que já existem
const cadastrarProdutos = db.transaction(() => {
    for (const produto of produtosIniciais) {
        inserirProduto.run(...produto);
    }
});

cadastrarProdutos();

// Exporta o banco para o servidor
module.exports = db;

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS outline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE outline;

DROP TABLE IF EXISTS movimentacoes_estoque;
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS sessoes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(100) NOT NULL,
    perfil ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(40) NOT NULL UNIQUE,
    nome VARCHAR(60) NOT NULL
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    categoria_id INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL CHECK (preco > 0),
    estoque INT NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    estoque_minimo INT NOT NULL DEFAULT 5 CHECK (estoque_minimo >= 0),
    imagem VARCHAR(255) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_final DECIMAL(10,2) NOT NULL,
    situacao VARCHAR(30) NOT NULL DEFAULT 'Concluído',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    nome_produto VARCHAR(120) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE movimentacoes_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    tipo ENUM('entrada', 'saida', 'ajuste') NOT NULL,
    quantidade INT NOT NULL,
    saldo_anterior INT NOT NULL,
    saldo_resultante INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id INT NULL,
    pedido_id INT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
    ('Administrador Outline', 'admin@outline.com', '$2b$10$EwYUu89AhaVeFljW/jvwVuGjFJdwz4hF8RdDMj92mmCS4s2ycxKXG', 'admin'),
    ('Cliente Demonstração', 'cliente@outline.com', '$2b$10$maJ3CkkMTa1w4RQgipyngOho4GHP0GacPTErZNPUHe0vx5ndeqLya', 'cliente');

INSERT INTO categorias (slug, nome) VALUES
    ('mochilas', 'Mochilas'),
    ('cadernos', 'Cadernos'),
    ('canetas', 'Canetas'),
    ('chaveiros', 'Chaveiros'),
    ('estojos', 'Estojos'),
    ('lapis', 'Lápis'),
    ('necessaires', 'Necessaires');

INSERT INTO produtos (codigo, nome, categoria_id, preco, estoque, imagem) VALUES
    ('OUT-001', 'Mochila Vinho', (SELECT id FROM categorias WHERE slug = 'mochilas'), 500.00, 10, 'imagens/jpg/mochilavinho.jpg'),
    ('OUT-002', 'Caderno Azul', (SELECT id FROM categorias WHERE slug = 'cadernos'), 39.90, 15, 'imagens/jpg/cadernoazul.jpg'),
    ('OUT-003', 'Kit de Canetas Coloridas', (SELECT id FROM categorias WHERE slug = 'canetas'), 29.90, 20, 'imagens/jpg/kitcanetas.jpg'),
    ('OUT-004', 'Chaveiros', (SELECT id FROM categorias WHERE slug = 'chaveiros'), 19.90, 25, 'imagens/png/chaveiros.png'),
    ('OUT-005', 'Estojo Preto', (SELECT id FROM categorias WHERE slug = 'estojos'), 59.90, 10, 'imagens/jpg/estojopreto.jpg'),
    ('OUT-006', 'Kit de Lápis de Cor', (SELECT id FROM categorias WHERE slug = 'lapis'), 50.00, 50, 'imagens/jpg/kitlapis.jpg'),
    ('OUT-007', 'Mochila Azul', (SELECT id FROM categorias WHERE slug = 'mochilas'), 349.90, 0, 'imagens/jpg/mochilaazul.jpg'),
    ('OUT-008', 'Necessaire Rosa', (SELECT id FROM categorias WHERE slug = 'necessaires'), 69.90, 20, 'imagens/jpg/necessarierosa.jpg'),
    ('OUT-009', 'Kit de Necessaires', (SELECT id FROM categorias WHERE slug = 'necessaires'), 89.90, 10, 'imagens/jpg/kitnecessaries.jpg'),
    ('OUT-010', 'Mochila Preta', (SELECT id FROM categorias WHERE slug = 'mochilas'), 399.90, 10, 'imagens/jpg/mochilapreta.jpg');

INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, saldo_anterior, saldo_resultante, motivo)
SELECT id, 'entrada', estoque, 0, estoque, 'Estoque inicial'
FROM produtos
WHERE estoque > 0;

# Outline

Loja virtual de papelaria e acessórios. Projeto da disciplina de Programação para Web (N2 - AT2).

- **Frontend:** HTML, CSS e JavaScript (pasta `public/`)
- **Backend:** Node.js + Express (`server.js`, `routes/`)
- **Banco de dados:** MySQL (`database/schema.sql`)

## Requisitos

- Node.js 18 ou superior
- MySQL 8.0.16 ou superior, ou MariaDB 10.5 ou superior (a API foi testada no MariaDB 10.11)

## Instalação

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo e preencha com os dados do seu MySQL:

   ```bash
   cp .env.example .env
   ```

   No Windows (PowerShell): `Copy-Item .env.example .env`

3. Crie o banco, as tabelas e os dados iniciais executando o arquivo `database/schema.sql` no MySQL (Workbench, DBeaver ou terminal):

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   Atenção: o script apaga e recria as tabelas. Rodar de novo volta o banco ao estado inicial.

4. Inicie o servidor:

   ```bash
   npm start
   ```

5. Acesse `http://localhost:3000`.

## Credenciais de demonstração

Somente para o ambiente de avaliação.

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@outline.com | admin123 |
| Cliente | cliente@outline.com | cliente123 |

O cadastro público cria apenas contas de cliente.

## Estrutura

```
public/       frontend (html, css, js e imagens)
routes/       rotas da API (auth, produtos, pedidos, estoque)
middleware/   autenticação e controle de acesso
utils/        validações e regras de negócio
database/     script SQL (tabelas e dados iniciais)
db.js         conexão com o MySQL
server.js     servidor Express
docs/API.md   documentação dos endpoints
```

## Modelo de dados

`usuarios`, `sessoes`, `categorias`, `produtos`, `pedidos`, `itens_pedido` e `movimentacoes_estoque`.

- Cada pedido pertence a um usuário.
- `itens_pedido` guarda nome, quantidade e preço unitário do momento da compra.
- Toda alteração de estoque gera uma linha em `movimentacoes_estoque` (entrada, saída ou ajuste), com saldo anterior, saldo resultante, motivo e usuário.

## Regras de negócio no servidor

- Subtotal, desconto e valor final são recalculados no backend a partir dos preços do banco. Valores enviados pelo frontend são ignorados.
- Desconto: compras a partir de R$ 300,00 recebem 10%.
- O pedido e a baixa de estoque acontecem na mesma transação. Se algo falha, nada é gravado.
- Senhas são armazenadas com hash (bcrypt).
- Rotas administrativas exigem perfil de administrador, verificado no backend.

## API

Veja [docs/API.md](docs/API.md).

# API Outline

Base: `http://localhost:3000/api`

Formato: JSON em todas as requisições e respostas.

Erros sempre vêm como `{ "erro": "mensagem" }`. Alguns erros trazem também `detalhes`.

## Autenticação

O login e o cadastro devolvem um `token`. Nas rotas protegidas, envie o token no cabeçalho:

```
Authorization: Bearer <token>
```

O token vale 7 dias ou até o logout. O frontend deve guardá-lo (por exemplo, no `localStorage`) e enviá-lo nas requisições protegidas.

Legenda da coluna Acesso: **público** (sem login), **login** (cliente ou admin), **admin** (somente administrador).

## Códigos HTTP

| Código | Quando |
|---|---|
| 200 | Consulta ou atualização realizada |
| 201 | Registro criado |
| 400 | Dados inválidos ou faltando |
| 401 | Não autenticado (sem token, token inválido ou expirado) |
| 403 | Autenticado, mas sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (e-mail ou código duplicado, estoque insuficiente) |
| 500 | Erro interno |

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | /health | público | Verifica se a API está no ar |
| POST | /auth/cadastro | público | Cria conta de cliente e já devolve o token |
| POST | /auth/login | público | Login |
| POST | /auth/logout | login | Encerra a sessão |
| GET | /auth/me | login | Dados do usuário logado |
| GET | /categorias | público | Lista categorias |
| GET | /produtos | público | Lista produtos ativos (filtros `busca` e `categoria`) |
| GET | /produtos/:codigo | público | Detalhe de um produto |
| POST | /produtos | admin | Cadastra produto |
| PUT | /produtos/:codigo | admin | Edita produto |
| DELETE | /produtos/:codigo | admin | Desativa produto |
| POST | /pedidos | login | Finaliza a compra |
| GET | /pedidos | login | Cliente: seus pedidos. Admin: todos |
| GET | /pedidos/:id | login | Detalhe de um pedido (dono ou admin) |
| GET | /estoque | admin | Saldo de todos os produtos com situação |
| POST | /estoque/movimentacoes | admin | Entrada, saída ou ajuste |
| GET | /estoque/movimentacoes | admin | Histórico de movimentações |

## Autenticação

### POST /auth/cadastro

```json
{ "nome": "Ana Souza", "email": "ana@email.com", "senha": "abc123", "confirmarSenha": "abc123" }
```

Resposta `201`:

```json
{ "usuario": { "id": 3, "nome": "Ana Souza", "email": "ana@email.com", "perfil": "cliente" }, "token": "..." }
```

Erros: `400` (campo inválido, senha com menos de 6 caracteres, senhas diferentes), `409` (e-mail já cadastrado).

### POST /auth/login

```json
{ "email": "cliente@outline.com", "senha": "cliente123" }
```

Resposta `200`: igual ao cadastro. Erros: `400` (campos vazios), `401` (`"E-mail ou senha inválidos."`).

### POST /auth/logout

Sem corpo. Resposta `200`: `{ "mensagem": "Sessão encerrada com sucesso." }`.

## Produtos

Objeto de produto:

```json
{
  "codigo": "OUT-001",
  "nome": "Mochila Vinho",
  "categoria": "mochilas",
  "categoria_nome": "Mochilas",
  "preco": 500,
  "estoque": 10,
  "estoque_minimo": 5,
  "imagem": "imagens/jpg/mochilavinho.jpg",
  "ativo": true
}
```

`preco` e `estoque` são números. `imagem` é um caminho relativo à pasta `public/`.

### GET /produtos

Parâmetros opcionais: `busca` (parte do nome, ignora maiúsculas e acentos), `categoria` (slug, por exemplo `mochilas`; `todos` ou vazio não filtra). Os dois podem ser combinados.

Sem resultado devolve `200` com lista vazia `[]`. O frontend deve mostrar a mensagem de "nenhum produto encontrado".

Admin pode usar `?todos=1` para incluir produtos desativados (cliente recebe `403`, visitante `401`).

### POST /produtos (admin)

```json
{
  "codigo": "OUT-011",
  "nome": "Pasta Catálogo",
  "categoria": "estojos",
  "preco": 25.5,
  "estoque": 8,
  "estoque_minimo": 5,
  "imagem": "imagens/jpg/estojo.jpg"
}
```

`estoque_minimo` é opcional (padrão 5). Resposta `201` com o produto. O estoque inicial gera uma movimentação de entrada.
Erros: `400` (dados inválidos ou categoria inexistente), `409` (código já existe).

### PUT /produtos/:codigo (admin)

Envie apenas os campos a alterar: `nome`, `categoria`, `preco`, `imagem`, `estoque_minimo`, `ativo` (true ou false).
O campo `estoque` é recusado com `400`: o saldo só muda por movimentações.

### DELETE /produtos/:codigo (admin)

Desativa o produto (ele some da loja, mas o histórico de pedidos continua). Para reativar: `PUT` com `{ "ativo": true }`.

## Pedidos

### POST /pedidos (login)

Envie só código e quantidade. Preços, desconto e valor final são calculados pelo servidor.

```json
{ "itens": [ { "codigo": "OUT-001", "quantidade": 1 }, { "codigo": "OUT-002", "quantidade": 2 } ] }
```

Resposta `201`:

```json
{
  "mensagem": "Pedido #12 realizado com sucesso.",
  "pedido": {
    "id": 12,
    "data": "2026-11-14T11:20:00.000Z",
    "situacao": "Concluído",
    "subtotal": 579.8,
    "desconto": 57.98,
    "valor_final": 521.82,
    "cliente": { "id": 2, "nome": "Cliente Demonstração" },
    "itens": [
      { "codigo": "OUT-001", "nome": "Mochila Vinho", "quantidade": 1, "preco_unitario": 500, "subtotal": 500 },
      { "codigo": "OUT-002", "nome": "Caderno Azul", "quantidade": 2, "preco_unitario": 39.9, "subtotal": 79.8 }
    ]
  }
}
```

Erros:

| Código | Situação |
|---|---|
| 400 | Carrinho vazio ou item inválido (quantidade zero, negativa ou fracionada) |
| 401 | Usuário não logado |
| 404 | Produto inexistente ou desativado (`detalhes` lista os códigos) |
| 409 | Estoque insuficiente (`detalhes` traz `solicitado` e `disponivel` de cada produto) |

Se qualquer item falhar, nenhum pedido é gravado e o estoque não muda.

### GET /pedidos

Cliente vê só os próprios pedidos. Admin vê todos. Ordem do mais novo para o mais antigo.

### GET /pedidos/:id

`403` se o pedido é de outro cliente. `404` se não existe.

## Estoque (admin)

### GET /estoque

Lista `codigo`, `nome`, `categoria`, `estoque`, `estoque_minimo`, `ativo` e `situacao`:

- `esgotado`: estoque igual a zero
- `baixo`: estoque menor ou igual ao estoque mínimo
- `normal`: acima do estoque mínimo

### POST /estoque/movimentacoes

Entrada (motivo opcional):

```json
{ "codigo": "OUT-007", "tipo": "entrada", "quantidade": 10, "motivo": "Reposição do fornecedor" }
```

Saída administrativa (motivo obrigatório; não pode passar do saldo):

```json
{ "codigo": "OUT-007", "tipo": "saida", "quantidade": 2, "motivo": "Avaria" }
```

Ajuste (informe o saldo correto após a contagem; motivo obrigatório):

```json
{ "codigo": "OUT-007", "tipo": "ajuste", "saldo": 7, "motivo": "Contagem física" }
```

Resposta `201`:

```json
{
  "mensagem": "Movimentação registrada com sucesso.",
  "movimentacao": { "id": 25, "codigo": "OUT-007", "tipo": "ajuste", "quantidade": 3, "saldo_anterior": 10, "saldo_resultante": 7 },
  "produto": { "codigo": "OUT-007", "nome": "Mochila Azul", "estoque": 7 }
}
```

Erros: `400` (quantidade zero, negativa ou nula, tipo inválido, motivo faltando, ajuste sem divergência), `404` (produto não existe), `409` (saída maior que o saldo).

### GET /estoque/movimentacoes

Filtros opcionais: `codigo`, `tipo` (`entrada`, `saida` ou `ajuste`) e `limite` (padrão 100, máximo 500). Mais recentes primeiro.

Cada linha traz `data`, `codigo`, `produto`, `tipo`, `quantidade`, `saldo_anterior`, `saldo_resultante`, `motivo`, `usuario` e `pedido_id` (preenchido nas saídas por venda).

## Regras importantes para o frontend

- Hoje o frontend ainda lê os produtos de `public/catalogo.js`. A integração consiste em trocar isso por `GET /produtos` (e usar `busca` e `categoria` na pesquisa e no filtro).
- O carrinho pode continuar no `localStorage` (código e quantidade). Ao finalizar, envie para `POST /pedidos`.
- Se a API responder `401` em uma rota protegida, apague o token salvo e mande o usuário para o login.
- Mostre ao usuário o texto de `erro` devolvido pela API.

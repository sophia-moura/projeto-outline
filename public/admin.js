document.addEventListener("DOMContentLoaded", async () => {
    const listaEstoque = document.getElementById("listaEstoque");
    const historicoEstoque = document.getElementById("historicoEstoque");
    const formMovimentacao = document.getElementById("formMovimentacao");

    const totalProdutos = document.getElementById("totalProdutos");
    const estoqueBaixo = document.getElementById("estoqueBaixo");
    const produtosEsgotados = document.getElementById("produtosEsgotados");

    const mensagem = document.getElementById("mensagemMovimentacao");

    const token = Auth.token();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    async function requisicao(url, opcoes = {}) {
        const resposta = await fetch(url, {
            ...opcoes,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...opcoes.headers
            }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível realizar a operação.");
        }

        return dados;
    }

    async function carregarEstoque() {
        try {
            const produtos = await requisicao("/api/estoque");

            totalProdutos.textContent = produtos.length;

            estoqueBaixo.textContent =
                produtos.filter(p => p.situacao === "baixo").length;

            produtosEsgotados.textContent =
                produtos.filter(p => p.situacao === "esgotado").length;

            listaEstoque.innerHTML = "";

            if (produtos.length === 0) {
                listaEstoque.innerHTML =
                    '<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';
                return;
            }

            produtos.forEach(produto => {
                const linha = document.createElement("tr");

                linha.innerHTML = `
                    <td>${produto.codigo}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.categoria}</td>
                    <td>${produto.estoque}</td>
                    <td>${produto.estoque_minimo}</td>
                    <td>${produto.situacao}</td>
                `;

                listaEstoque.appendChild(linha);
            });

        } catch (erro) {
            listaEstoque.innerHTML =
                `<tr><td colspan="6">${erro.message}</td></tr>`;
        }
    }

    async function carregarHistorico() {
        try {
            const movimentacoes =
                await requisicao("/api/estoque/movimentacoes");

            historicoEstoque.innerHTML = "";

            if (movimentacoes.length === 0) {
                historicoEstoque.innerHTML =
                    '<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>';
                return;
            }

            movimentacoes.forEach(item => {
                const linha = document.createElement("tr");

                linha.innerHTML = `
                    <td>${item.produto}</td>
                    <td>${item.tipo}</td>
                    <td>${item.quantidade}</td>
                    <td>${item.motivo}</td>
                    <td>${new Date(item.data).toLocaleString("pt-BR")}</td>
                `;

                historicoEstoque.appendChild(linha);
            });

        } catch (erro) {
            historicoEstoque.innerHTML =
                `<tr><td colspan="5">${erro.message}</td></tr>`;
        }
    }

    formMovimentacao.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const codigo = document.getElementById("codigoProduto").value.trim();
        const tipo = document.getElementById("tipoMovimentacao").value;
        const quantidade = Number(document.getElementById("quantidade").value);
        const motivo = document.getElementById("motivo").value.trim();

        const dados = { codigo, tipo, motivo };

        if (tipo === "ajuste") {
            dados.saldo = quantidade;
        } else {
            dados.quantidade = quantidade;
        }

        try {
            const resultado = await requisicao(
                "/api/estoque/movimentacoes",
                {
                    method: "POST",
                    body: JSON.stringify(dados)
                }
            );

            mensagem.textContent = resultado.mensagem;
            mensagem.style.color = "green";

            formMovimentacao.reset();

            await carregarEstoque();
            await carregarHistorico();

        } catch (erro) {
            mensagem.textContent = erro.message;
            mensagem.style.color = "red";
        }
    });

    await carregarEstoque();
    await carregarHistorico();
});
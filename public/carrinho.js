
const cartItems = document.getElementById("cart-items");
const cartQuantity = document.getElementById("cart-quantity");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartDiscount = document.getElementById("cart-discount");
const cartDiscountLabel = document.getElementById("cart-discount-label");
const cartDiscountHint = document.getElementById("cart-discount-hint");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const finalizarCompra = document.getElementById("finalizar-compra");

const REGRA_DESCONTO = {
    valorMinimo: 300,
    percentual: 10
};

const arredondar = valor =>
    Math.round((valor + Number.EPSILON) * 100) / 100;

const formatarMoeda = valor =>
    `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;

const buscarNoCatalogo = codigo =>
    produtos.find(produto => produto.codigo === codigo);

class Carrinho {
    constructor() {
        this.itens = this.lerItensSalvos();
    }

    lerItensSalvos() {
        try {
            const salvos = JSON.parse(localStorage.getItem("carrinho"));
            return Array.isArray(salvos) ? salvos : [];
        } catch (erro) {
            return [];
        }
    }

    sincronizarComCatalogo() {
        const avisos = [];
        const sincronizados = [];

        this.itens.forEach(item => {
            const produto = buscarNoCatalogo(item.codigo);

            if (!produto || !produto.disponivel()) {
                avisos.push(
                    `"${item.nome || item.codigo}" não está mais disponível e foi removido do carrinho.`
                );
                return;
            }

            let quantidade =
                Number.isInteger(item.quantidade) && item.quantidade > 0
                    ? item.quantidade
                    : 1;

            if (quantidade > produto.estoque) {
                avisos.push(
                    `A quantidade de "${produto.nome}" foi ajustada para ${produto.estoque} (estoque disponível).`
                );

                quantidade = produto.estoque;
            }

            sincronizados.push({
                codigo: produto.codigo,
                nome: produto.nome,
                preco: produto.preco,
                imagem: produto.imagem,
                estoque: produto.estoque,
                quantidade: quantidade
            });
        });

        this.itens = sincronizados;

        return avisos;
    }

    aumentarQuantidade(index) {
        const item = this.itens[index];

        if (!item) {
            return;
        }

        const produto = buscarNoCatalogo(item.codigo);
        const estoque = produto ? produto.estoque : item.estoque;

        if (item.quantidade >= estoque) {
            alert(
                `Não é possível adicionar mais unidades. Estoque disponível: ${estoque}.`
            );
            return;
        }

        item.quantidade++;
        this.salvar();
    }

    diminuirQuantidade(index) {
        if (!this.itens[index]) {
            return;
        }

        if (this.itens[index].quantidade > 1) {
            this.itens[index].quantidade--;
        } else {
            this.itens.splice(index, 1);
        }

        this.salvar();
    }

    removerProduto(index) {
        this.itens.splice(index, 1);
        this.salvar();
    }

    calcularQuantidadeTotal() {
        return this.itens.reduce(
            (total, item) => total + item.quantidade,
            0
        );
    }

    calcularSubtotal() {
        const subtotal = this.itens.reduce(
            (total, item) => total + item.preco * item.quantidade,
            0
        );

        return arredondar(subtotal);
    }

    calcularDesconto() {
        const subtotal = this.calcularSubtotal();

        if (subtotal >= REGRA_DESCONTO.valorMinimo) {
            return arredondar(
                subtotal * REGRA_DESCONTO.percentual / 100
            );
        }

        return 0;
    }

    calcularTotal() {
        return arredondar(
            this.calcularSubtotal() - this.calcularDesconto()
        );
    }

    calcularFaltaParaDesconto() {
        const subtotal = this.calcularSubtotal();

        if (
            this.itens.length === 0 ||
            subtotal >= REGRA_DESCONTO.valorMinimo
        ) {
            return 0;
        }

        return arredondar(
            REGRA_DESCONTO.valorMinimo - subtotal
        );
    }

    salvar() {
        const enxuto = this.itens.map(item => ({
            codigo: item.codigo,
            quantidade: item.quantidade
        }));

        localStorage.setItem("carrinho", JSON.stringify(enxuto));

        atualizarCarrinho();
    }
}

const carrinho = new Carrinho();

function atualizarResumo() {
    const desconto = carrinho.calcularDesconto();
    const falta = carrinho.calcularFaltaParaDesconto();

    cartQuantity.textContent = carrinho.calcularQuantidadeTotal();
    cartSubtotal.textContent = formatarMoeda(carrinho.calcularSubtotal());
    cartDiscount.textContent = formatarMoeda(desconto);
    cartTotal.textContent = formatarMoeda(carrinho.calcularTotal());
    cartCount.textContent = carrinho.calcularQuantidadeTotal();

    if (desconto > 0) {
        cartDiscountLabel.textContent =
            `Desconto (${REGRA_DESCONTO.percentual}%)`;
    } else {
        cartDiscountLabel.textContent = "Desconto";
    }

    if (falta > 0) {
        cartDiscountHint.textContent =
            `Faltam ${formatarMoeda(falta)} para ganhar ${REGRA_DESCONTO.percentual}% de desconto ` +
            `(compras a partir de ${formatarMoeda(REGRA_DESCONTO.valorMinimo)}).`;

        cartDiscountHint.hidden = false;
    } else {
        cartDiscountHint.hidden = true;
    }
}

function atualizarCarrinho() {
    cartItems.innerHTML = "";

    if (carrinho.itens.length === 0) {
        cartItems.innerHTML = `
            <p class="empty-cart">
                Seu carrinho está vazio.
            </p>
        `;

        atualizarResumo();
        return;
    }

    carrinho.itens.forEach((produto, index) => {
        const subtotalItem = produto.preco * produto.quantidade;

        const item = document.createElement("div");
        item.classList.add("cart-item");

        item.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">

            <div class="cart-item-info">
                <h3>${produto.nome}</h3>

                <p class="cart-item-price">
                    ${formatarMoeda(produto.preco)} un. · subtotal ${formatarMoeda(subtotalItem)}
                </p>

                <div class="quantity-controls">
                    <button onclick="diminuirQuantidade(${index})">-</button>
                    <span>${produto.quantidade}</span>
                    <button onclick="aumentarQuantidade(${index})">+</button>
                </div>

                <button class="remove-button" onclick="removerProduto(${index})">
                    Remover
                </button>
            </div>
        `;

        cartItems.appendChild(item);
    });

    atualizarResumo();
}

function aumentarQuantidade(index) {
    carrinho.aumentarQuantidade(index);
}

function diminuirQuantidade(index) {
    carrinho.diminuirQuantidade(index);
}

function removerProduto(index) {
    carrinho.removerProduto(index);
}

const montarPedido = () =>
    carrinho.itens.map(item => ({
        codigo: item.codigo,
        quantidade: item.quantidade
    }));

function montarResumoFinal(pedido) {
    let resumo = `Pedido #${pedido.id} realizado com sucesso!\n\n`;

    resumo += "Itens comprados:\n";

    pedido.itens.forEach(item => {
        resumo +=
            `- ${item.nome} (x${item.quantidade}): ` +
            `${formatarMoeda(item.subtotal)}\n`;
    });

    resumo += `\nSubtotal: ${formatarMoeda(pedido.subtotal)}`;
    resumo += `\nDesconto: ${formatarMoeda(pedido.desconto)}`;
    resumo += `\nValor final: ${formatarMoeda(pedido.valor_final)}`;

    return resumo;
}

async function finalizarPedido() {
    if (carrinho.itens.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }

    if (!Auth.estaLogado()) {
        alert(
            "Faça login para finalizar a compra. Os itens do seu carrinho serão mantidos."
        );

        window.location.href = "login.html?retorno=carrinho.html";
        return;
    }

    const token = Auth.token();

    if (!token) {
        alert("Sua sessão não foi encontrada. Faça login novamente.");
        window.location.href = "login.html?retorno=carrinho.html";
        return;
    }

    finalizarCompra.disabled = true;
    finalizarCompra.textContent = "Finalizando compra...";

    try {
        const resposta = await fetch("/api/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                itens: montarPedido()
            })
        });

        const dados = await resposta.json();

        if (resposta.status === 401) {
            alert(
                "Sua sessão expirou. Faça login novamente para continuar. Seu carrinho será mantido."
            );

            await Auth.sair();

            window.location.href = "login.html?retorno=carrinho.html";
            return;
        }

        if (!resposta.ok) {
            let mensagem = dados.erro || "Não foi possível finalizar a compra.";

            if (Array.isArray(dados.detalhes) && dados.detalhes.length > 0) {
                mensagem += "\n\n";

                dados.detalhes.forEach(item => {
                    mensagem +=
                        `${item.nome || item.codigo}: ${item.motivo}\n`;

                    if (item.disponivel !== undefined) {
                        mensagem +=
                            `Quantidade disponível: ${item.disponivel}\n`;
                    }
                });
            }

            alert(
                `${mensagem}\n\nSeus produtos continuam no carrinho. Revise os itens e tente novamente.`
            );

            return;
        }

        if (!dados.pedido || !dados.pedido.id) {
            throw new Error("A API não retornou os dados do pedido.");
        }

        carrinho.itens = [];
        carrinho.salvar();

        alert(montarResumoFinal(dados.pedido));

    } catch (erro) {
        console.error("Erro ao finalizar a compra:", erro);

        alert(
            "Não foi possível concluir a compra. Verifique sua conexão e tente novamente. Seus produtos continuam no carrinho."
        );

    } finally {
        finalizarCompra.disabled = false;
        finalizarCompra.textContent = "Finalizar compra";
    }
}

finalizarCompra.addEventListener("click", finalizarPedido);

async function inicializarCarrinho() {
    cartItems.innerHTML = "<p>Carregando carrinho...</p>";
    finalizarCompra.disabled = true;

    try {
        await carregarCatalogo();

        const avisos = carrinho.sincronizarComCatalogo();

        carrinho.salvar();

        if (avisos.length > 0) {
            alert(avisos.join("\n"));
        }

    } catch (erro) {
        console.error("Erro ao carregar os produtos do carrinho:", erro);

        cartItems.innerHTML = `
            <p class="empty-cart">
                Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.
            </p>
        `;

        atualizarResumo();
        return;
    }

    finalizarCompra.disabled = false;
}

inicializarCarrinho();

const cartItems = document.getElementById("cart-items");
const cartQuantity = document.getElementById("cart-quantity");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartDiscount = document.getElementById("cart-discount");
const cartDiscountLabel = document.getElementById("cart-discount-label");
const cartDiscountHint = document.getElementById("cart-discount-hint");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const finalizarCompra = document.getElementById("finalizar-compra");

// Regra de desconto: compras a partir de R$ 300,00 ganham 10%.
// O backend deve aplicar exatamente a mesma regra na confirmação do pedido.
const REGRA_DESCONTO = {
    valorMinimo: 300,
    percentual: 10
};

const arredondar = valor => Math.round((valor + Number.EPSILON) * 100) / 100;

const formatarMoeda = valor => `R$ ${valor.toFixed(2).replace(".", ",")}`;

const buscarNoCatalogo = codigo => produtos.find(produto => produto.codigo === codigo);

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

    // Reconstrói cada item a partir do catálogo (nome, preço, imagem, estoque)
    // e ajusta a quantidade ao estoque atual. Retorna os avisos para o usuário.
    sincronizarComCatalogo() {
        const avisos = [];
        const sincronizados = [];

        this.itens.forEach(item => {
            const produto = buscarNoCatalogo(item.codigo);

            if (!produto || !produto.disponivel()) {
                avisos.push(`"${item.nome || item.codigo}" não está mais disponível e foi removido do carrinho.`);
                return;
            }

            let quantidade = Number.isInteger(item.quantidade) && item.quantidade > 0
                ? item.quantidade
                : 1;

            if (quantidade > produto.estoque) {
                avisos.push(
                    `A quantidade de "${produto.nome}" foi ajustada para ${produto.estoque} ` +
                    `(estoque disponível).`
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
        const produto = buscarNoCatalogo(item.codigo);
        const estoque = produto ? produto.estoque : item.estoque;

        if (item.quantidade >= estoque) {
            alert(
                `Não é possível adicionar mais unidades. ` +
                `Estoque disponível: ${estoque}.`
            );
            return;
        }

        item.quantidade++;

        this.salvar();
    }

    diminuirQuantidade(index) {
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
        let quantidadeTotal = 0;

        for (let i = 0; i < this.itens.length; i++) {
            quantidadeTotal += this.itens[i].quantidade;
        }

        return quantidadeTotal;
    }

    calcularSubtotal() {
        let subtotal = 0;

        for (let i = 0; i < this.itens.length; i++) {
            subtotal += this.itens[i].preco * this.itens[i].quantidade;
        }

        return arredondar(subtotal);
    }

    calcularDesconto() {
        const subtotal = this.calcularSubtotal();

        if (subtotal >= REGRA_DESCONTO.valorMinimo) {
            return arredondar(subtotal * REGRA_DESCONTO.percentual / 100);
        }

        return 0;
    }

    calcularTotal() {
        return arredondar(this.calcularSubtotal() - this.calcularDesconto());
    }

    // Quanto falta para atingir o desconto (0 se já atingiu ou carrinho vazio).
    calcularFaltaParaDesconto() {
        const subtotal = this.calcularSubtotal();

        if (this.itens.length === 0 || subtotal >= REGRA_DESCONTO.valorMinimo) {
            return 0;
        }

        return arredondar(REGRA_DESCONTO.valorMinimo - subtotal);
    }

    // Só código e quantidade são gravados. Preço, nome e estoque vêm do catálogo.
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

    // A regra aparece no resumo: rótulo com o percentual quando aplicada
    // e, caso contrário, quanto falta para ganhar o desconto.
    if (desconto > 0) {
        cartDiscountLabel.textContent = `Desconto (${REGRA_DESCONTO.percentual}%)`;
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

// Dados que devem ir ao backend na finalização: apenas código e quantidade.
// Preço, subtotal, desconto e total NÃO são enviados como fonte definitiva;
// o servidor recalcula tudo a partir do banco.
const montarPedido = () => carrinho.itens.map(item => ({
    codigo: item.codigo,
    quantidade: item.quantidade
}));

const montarResumoFinal = () => {
    let linhas = "Itens comprados:\n";

    carrinho.itens.forEach(produto => {
        linhas += `- ${produto.nome} (x${produto.quantidade}): ${formatarMoeda(produto.preco * produto.quantidade)}\n`;
    });

    linhas += `\nQuantidade de itens: ${carrinho.calcularQuantidadeTotal()}`;
    linhas += `\nSubtotal: ${formatarMoeda(carrinho.calcularSubtotal())}`;
    linhas += `\nDesconto: ${formatarMoeda(carrinho.calcularDesconto())}`;
    linhas += `\nValor final: ${formatarMoeda(carrinho.calcularTotal())}`;

    return linhas;
};

finalizarCompra.addEventListener("click", () => {
    if (carrinho.itens.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }

    // Finalizar exige login. O carrinho fica no localStorage, então
    // sobrevive ao login e o usuário volta direto para esta página.
    if (!Auth.estaLogado()) {
        alert("Faça login para finalizar a compra. Os itens do seu carrinho serão mantidos.");
        window.location.href = "login.html?retorno=carrinho.html";
        return;
    }

    // Revalida o estoque no momento da finalização.
    const avisos = carrinho.sincronizarComCatalogo();

    if (avisos.length > 0) {
        carrinho.salvar();
        alert(avisos.join("\n") + "\n\nRevise o carrinho e tente finalizar novamente.");
        return;
    }

    // TODO (backend): enviar montarPedido() para a API e exibir o resumo
    // retornado pelo servidor. Enquanto não existe, mostramos o cálculo local.
    alert(`Compra finalizada com sucesso!\n\n${montarResumoFinal()}`);

    carrinho.itens = [];
    carrinho.salvar();
});

// Ao abrir a página: alinha o carrinho ao catálogo e avisa sobre ajustes.
const avisosIniciais = carrinho.sincronizarComCatalogo();

carrinho.salvar();

if (avisosIniciais.length > 0) {
    alert(avisosIniciais.join("\n"));
}

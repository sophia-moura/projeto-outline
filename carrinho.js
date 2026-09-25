const cartItems = document.getElementById("cart-items");
const cartQuantity = document.getElementById("cart-quantity");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartDiscount = document.getElementById("cart-discount");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const finalizarCompra = document.getElementById("finalizar-compra");

class Carrinho {
    constructor() {
        this.itens = JSON.parse(localStorage.getItem("carrinho")) || [];
    }

    aumentarQuantidade(index) {
        const produto = this.itens[index];

        if (produto.quantidade >= produto.estoque) {
            alert(
                `Não é possível adicionar mais unidades. ` +
                `Estoque disponível: ${produto.estoque}.`
            );
            return;
        }

        produto.quantidade++;

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

        return subtotal;
    }

    calcularDesconto() {
        const subtotal = this.calcularSubtotal();

        if (subtotal >= 300) {
            return subtotal * 0.10;
        }

        return 0;
    }

    calcularTotal() {
        return this.calcularSubtotal() - this.calcularDesconto();
    }

    salvar() {
        localStorage.setItem(
            "carrinho",
            JSON.stringify(this.itens)
        );

        atualizarCarrinho();
    }
}

const carrinho = new Carrinho();

const formatarMoeda = valor => `R$ ${valor.toFixed(2).replace(".", ",")}`;

function atualizarCarrinho() {
    cartItems.innerHTML = "";

    if (carrinho.itens.length === 0) {
        cartItems.innerHTML = `
            <p class="empty-cart">
                Seu carrinho está vazio.
            </p>
        `;

        cartQuantity.textContent = "0";
        cartSubtotal.textContent = formatarMoeda(0);
        cartDiscount.textContent = formatarMoeda(0);
        cartTotal.textContent = formatarMoeda(0);
        cartCount.textContent = "0";

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

    cartQuantity.textContent = carrinho.calcularQuantidadeTotal();
    cartSubtotal.textContent = formatarMoeda(carrinho.calcularSubtotal());
    cartDiscount.textContent = formatarMoeda(carrinho.calcularDesconto());
    cartTotal.textContent = formatarMoeda(carrinho.calcularTotal());
    cartCount.textContent = carrinho.calcularQuantidadeTotal();
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

    alert(`Compra finalizada com sucesso!\n\n${montarResumoFinal()}`);

    carrinho.itens = [];
    carrinho.salvar();
});

atualizarCarrinho();

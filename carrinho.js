const cartItems = document.getElementById("cart-items");
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

    salvar() {

        localStorage.setItem(
            "carrinho",
            JSON.stringify(this.itens)
        );

        atualizarCarrinho();
    }
}

const carrinho = new Carrinho();

function atualizarCarrinho() {

    cartItems.innerHTML = "";

    if (carrinho.itens.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Seu carrinho está vazio.
            </p>
        `;

        cartTotal.textContent = "R$ 0,00";
        cartCount.textContent = "0";

        return;
    }

    let total = 0;
    let quantidadeTotal = 0;

    carrinho.itens.forEach((produto, index) => {

        total += produto.preco * produto.quantidade;
        quantidadeTotal += produto.quantidade;

        const item = document.createElement("div");
        item.classList.add("cart-item");

        item.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">

            <div class="cart-item-info">

                <h3>${produto.nome}</h3>

                <p class="cart-item-price">
                    R$ ${produto.preco.toFixed(2).replace(".", ",")}
                </p>

                <div class="quantity-controls">

                    <button onclick="diminuirQuantidade(${index})">
                        -
                    </button>

                    <span>${produto.quantidade}</span>

                    <button onclick="aumentarQuantidade(${index})">
                        +
                    </button>

                </div>

                <button class="remove-button" onclick="removerProduto(${index})">
                    Remover
                </button>

            </div>
        `;

        cartItems.appendChild(item);
    });

    cartTotal.textContent =
        `R$ ${total.toFixed(2).replace(".", ",")}`;

    cartCount.textContent = quantidadeTotal;
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


finalizarCompra.addEventListener("click", () => {

    if (carrinho.itens.length === 0) {

        alert("Seu carrinho está vazio.");

    } else {

        alert("Compra finalizada com sucesso!");

    }

});


atualizarCarrinho();

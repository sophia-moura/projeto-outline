const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const finalizarCompra = document.getElementById("finalizar-compra");

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function atualizarCarrinho() {

    cartItems.innerHTML = "";

    if (carrinho.length === 0) {

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

    carrinho.forEach((produto, index) => {

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

    carrinho[index].quantidade++;

    salvarCarrinho();
}


function diminuirQuantidade(index) {

    if (carrinho[index].quantidade > 1) {

        carrinho[index].quantidade--;

    } else {

        carrinho.splice(index, 1);

    }

    salvarCarrinho();
}


function removerProduto(index) {

    carrinho.splice(index, 1);

    salvarCarrinho();
}


function salvarCarrinho() {

    localStorage.setItem(
        "carrinho",
        JSON.stringify(carrinho)
    );

    atualizarCarrinho();
}


finalizarCompra.addEventListener("click", () => {

    if (carrinho.length === 0) {

        alert("Seu carrinho está vazio.");

    } else {

        alert("Compra finalizada com sucesso!");

    }

});


atualizarCarrinho();

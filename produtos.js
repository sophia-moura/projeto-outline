const produtos = [
    {
        nome: "Mochila Vinho",
        preco: 500.00,
        categoria: "mochilas",
        imagem: "produto-mochila-vinho.jpeg"
    },
    {
        nome: "Caderno Azul",
        preco: 39.90,
        categoria: "cadernos",
        imagem: "produto-caderno-azul.jpeg"
    },
    {
        nome: "Kit de Canetas Coloridas",
        preco: 29.90,
        categoria: "canetas",
        imagem: "produto-canetas-coloridas.jpeg"
    },
    {
        nome: "Chaveiros",
        preco: 19.90,
        categoria: "chaveiros",
        imagem: "produto-chaveiros.jpeg"
    },
    {
        nome: "Estojo Preto",
        preco: 59.90,
        categoria: "estojos",
        imagem: "produto-estojo-preto.jpeg"
    },
    {
        nome: "Kit de Lápis de Cor",
        preco: 50.00,
        categoria: "lapis",
        imagem: "produto-lapis-de-cor.jpeg"
    },
    {
        nome: "Mochila Azul",
        preco: 349.90,
        categoria: "mochilas",
        imagem: "produto-mochila-azul.jpeg"
    },
    {
        nome: "Necessaire Rosa",
        preco: 69.90,
        categoria: "necessaires",
        imagem: "produto-necessaire-rosa.jpeg"
    },
    {
        nome: "Kit de Necessaires",
        preco: 89.90,
        categoria: "necessaires",
        imagem: "produto-necessaires.jpeg"
    },
    {
        nome: "Mochila Preta",
        preco: 399.90,
        categoria: "mochilas",
        imagem: "produto-mochila-preta.jpeg"
    }
];

const container = document.getElementById("products-container");

function mostrarProdutos(lista) {
    container.innerHTML = "";

    lista.forEach(produto => {
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
            <div class="product-image">
                <img src="${produto.imagem}" alt="${produto.nome}">
            </div>

            <div class="product-info">
                <h3>${produto.nome}</h3>
                <p class="price">R$ ${produto.preco.toFixed(2).replace(".", ",")}</p>
                <p class="installments">
                    ${produto.preco >= 100 ? "3x sem juros" : "2x sem juros"}
                </p>
                <button class="add-cart">
                    Adicionar ao carrinho
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

mostrarProdutos(produtos);

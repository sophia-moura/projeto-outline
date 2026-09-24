const produtos = [
    {
        nome: "Mochila Vinho",
        preco: 500.00,
        categoria: "mochilas",
        estoque: 10,
        imagem: "/imagens/jpeg/produto-mochila-vinho.jpeg"
    },
    {
        nome: "Caderno Azul",
        preco: 39.90,
        categoria: "cadernos",
        estoque: 15,
        imagem: "/imagens/jpeg/produto-caderno-azul.jpeg"
    },
    {
        nome: "Kit de Canetas Coloridas",
        preco: 29.90,
        categoria: "canetas",
        estoque: 20,
        imagem: "/imagens/jpeg/produto-canetas-coloridas.jpeg"
    },
    {
        nome: "Chaveiros",
        preco: 19.90,
        categoria: "chaveiros",
        estoque: 25,
        imagem: "/imagens/jpeg/produto-chaveiros.jpeg"
    },
    {
        nome: "Estojo Preto",
        preco: 59.90,
        categoria: "estojos",
        estoque: 10,
        imagem: "/imagens/jpeg/produto-estojo-preto.jpeg"
    },
    {
        nome: "Kit de Lápis de Cor",
        preco: 50.00,
        categoria: "lapis",
        estoque: 50,
        imagem: "/imagens/jpeg/produto-lapis-de-cor.jpeg"
    },
    {
        nome: "Mochila Azul",
        preco: 349.90,
        categoria: "mochilas",
        estoque: 0,
        imagem: "/imagens/jpeg/produto-mochila-azul.jpeg"
    },
    {
        nome: "Necessaire Rosa",
        preco: 69.90,
        categoria: "necessaires",
        estoque: 20,
        imagem: "/imagens/jpeg/produto-necessaire-rosa.jpeg"
    },
    {
        nome: "Kit de Necessaires",
        preco: 89.90,
        categoria: "necessaires",
        estoque: 10,
        imagem: "/imagens/jpeg/produto-necessaires.jpeg"
    },
    {
        nome: "Mochila Preta",
        preco: 399.90,
        categoria: "mochilas",
        estoque: 10,
        imagem: "/imagens/jpeg/produto-mochila-preta.jpeg"
    }
];

const container = document.getElementById("products-container");
const campoPesquisa = document.getElementById("search-input");
const botaoPesquisa = document.getElementById("search-button");
const botoesCategoria = document.querySelectorAll(".category-btn");
const contadorCarrinho = document.getElementById("cart-count");

let categoriaAtual = "todos";

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function atualizarContadorCarrinho() {
    const quantidade = carrinho.reduce(
        (total, produto) => total + produto.quantidade,
        0
    );

    contadorCarrinho.textContent = quantidade;
}

function adicionarAoCarrinho(nomeProduto) {

    const produto = produtos.find(
        produto => produto.nome === nomeProduto
    );

    if (!produto) {
        return;
    }

    // Produto sem estoque
    if (produto.estoque === 0) {
        alert("Produto sem estoque.");
        return;
    }

    const produtoExistente = carrinho.find(
        item => item.nome === nomeProduto
    );

    // Produto já está no carrinho
    if (produtoExistente) {

        // Verifica se ainda existe estoque disponível
        if (produtoExistente.quantidade >= produto.estoque) {
            alert(
                `Não é possível adicionar mais unidades. ` +
                `Estoque disponível: ${produto.estoque}.`
            );
            return;
        }

        produtoExistente.quantidade++;

    } else {

        carrinho.push({
    nome: produto.nome,
    preco: produto.preco,
    imagem: produto.imagem,
    quantidade: 1,
    estoque: produto.estoque
});
    }

    localStorage.setItem(
        "carrinho",
        JSON.stringify(carrinho)
    );

    atualizarContadorCarrinho();
}

function removerEspacosDuplicados(texto) {
    let resultado = texto;

    while (resultado.includes("  ")) {
        resultado = resultado.replace("  ", " ");
    }

    return resultado;
}

const normalizarTexto = texto => {
    const semAcento = texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return removerEspacosDuplicados(semAcento.toLowerCase().trim());
};

// FUNÇÃO CORRIGIDA: Agora usa .startsWith() em vez de .includes()
function buscarProdutosPorNome(lista, textoDigitado) {
    const termo = normalizarTexto(textoDigitado);
    const encontrados = [];

    if (termo === "") {
        return lista;
    }

    for (let i = 0; i < lista.length; i++) {
        const nomeProduto = normalizarTexto(lista[i].nome);

        // Modificado aqui para buscar apenas pelo início do texto
        if (nomeProduto.startsWith(termo)) {
            encontrados.push(lista[i]);
        }
    }

    return encontrados;
}

function mostrarMensagemSemResultado(textoDigitado) {
    const mensagem = document.createElement("p");
    mensagem.classList.add("no-products");

    if (textoDigitado !== "") {
        mensagem.textContent = `Nenhum produto encontrado para "${textoDigitado}". Tente buscar por outro nome.`;
    } else {
        mensagem.textContent = "Nenhum produto disponível nesta categoria.";
    }

    container.appendChild(mensagem);
}

function mostrarProdutos(lista, textoDigitado = "") {
    container.innerHTML = "";

    if (lista.length === 0) {
        mostrarMensagemSemResultado(textoDigitado);
        return;
    }

    lista.forEach(produto => {
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
            <div class="product-image">
                <img src="${produto.imagem}" alt="${produto.nome}">
            </div>

            <div class="product-info">
                <h3>${produto.nome}</h3>

                <p class="price">
                    R$ ${produto.preco.toFixed(2).replace(".", ",")}
                </p>

                <p class="installments">
                    ${
                        produto.preco >= 100
                            ? "3x sem juros"
                            : "2x sem juros"
                    }
                </p>

                <p class="stock">
    ${
        produto.estoque === 0
            ? "Produto sem estoque"
            : `Estoque disponível: ${produto.estoque}`
    }
</p>

                <button class="add-cart">
                    Adicionar ao carrinho
                </button>
            </div>
        `;

        const botaoCarrinho = card.querySelector(".add-cart");
if (produto.estoque === 0) {
    botaoCarrinho.disabled = true;
    botaoCarrinho.textContent = "Sem estoque";
}
        botaoCarrinho.addEventListener("click", () => {
            adicionarAoCarrinho(produto.nome);
        });

        container.appendChild(card);
    });
}

function aplicarFiltros() {
    const textoDigitado = campoPesquisa.value.trim();

    let produtosFiltrados = produtos;

    if (categoriaAtual !== "todos") {
        produtosFiltrados = produtosFiltrados.filter(produto =>
            produto.categoria === categoriaAtual
        );
    }

    produtosFiltrados = buscarProdutosPorNome(produtosFiltrados, textoDigitado);

    mostrarProdutos(produtosFiltrados, textoDigitado);
}

botoesCategoria.forEach(botao => {
    botao.addEventListener("click", () => {
        categoriaAtual = botao.dataset.category;

        botoesCategoria.forEach(b => {
            b.classList.remove("active");
        });

        botao.classList.add("active");

        aplicarFiltros();
    });
});

botaoPesquisa.addEventListener("click", aplicarFiltros);

campoPesquisa.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
        aplicarFiltros();
    }
});

mostrarProdutos(produtos);

atualizarContadorCarrinho();
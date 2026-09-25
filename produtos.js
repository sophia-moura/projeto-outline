class Produto {
    constructor(codigo, nome, categoria, preco, estoque, imagem) {
        this.codigo = codigo;
        this.nome = nome;
        this.categoria = categoria;
        this.preco = preco;
        this.estoque = estoque;
        this.imagem = imagem;
    }

    disponivel() {
        return this.estoque > 0;
    }

    reduzirEstoque(quantidade) {
        this.estoque -= quantidade;
    }
}

const nomesCategoria = {
    mochilas: "Mochilas",
    cadernos: "Cadernos",
    canetas: "Canetas",
    chaveiros: "Chaveiros",
    estojos: "Estojos",
    lapis: "Lápis",
    necessaires: "Necessaires"
};

const produtos = [
    new Produto("OUT-001", "Mochila Vinho", "mochilas", 500.00, 10, "imagens/jpeg/produto-mochila-vinho.jpeg"),
    new Produto("OUT-002", "Caderno Azul", "cadernos", 39.90, 15, "imagens/jpeg/produto-caderno-azul.jpeg"),
    new Produto("OUT-003", "Kit de Canetas Coloridas", "canetas", 29.90, 20, "imagens/jpeg/produto-canetas-coloridas.jpeg"),
    new Produto("OUT-004", "Chaveiros", "chaveiros", 19.90, 25, "imagens/jpeg/produto-chaveiros.jpeg"),
    new Produto("OUT-005", "Estojo Preto", "estojos", 59.90, 10, "imagens/jpeg/produto-estojo-preto.jpeg"),
    new Produto("OUT-006", "Kit de Lápis de Cor", "lapis", 50.00, 50, "imagens/jpeg/produto-lapis-de-cor.jpeg"),
    new Produto("OUT-007", "Mochila Azul", "mochilas", 349.90, 0, "imagens/jpeg/produto-mochila-azul.jpeg"),
    new Produto("OUT-008", "Necessaire Rosa", "necessaires", 69.90, 20, "imagens/jpeg/produto-necessaire-rosa.jpeg"),
    new Produto("OUT-009", "Kit de Necessaires", "necessaires", 89.90, 10, "imagens/jpeg/produto-necessaires.jpeg"),
    new Produto("OUT-010", "Mochila Preta", "mochilas", 399.90, 10, "imagens/jpeg/produto-mochila-preta.jpeg")
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

function adicionarAoCarrinho(codigoProduto) {

    const produto = produtos.find(
        produto => produto.codigo === codigoProduto
    );

    if (!produto) {
        return;
    }

    if (!produto.disponivel()) {
        alert("Produto sem estoque.");
        return;
    }

    const produtoExistente = carrinho.find(
        item => item.codigo === codigoProduto
    );

    if (produtoExistente) {

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
            codigo: produto.codigo,
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

function buscarProdutosPorNome(lista, textoDigitado) {
    const termo = normalizarTexto(textoDigitado);
    const encontrados = [];

    if (termo === "") {
        return lista;
    }

    for (let i = 0; i < lista.length; i++) {
        const nomeProduto = normalizarTexto(lista[i].nome);

        if (nomeProduto.includes(termo)) {
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

        const disponivel = produto.estoque > 0;

        card.innerHTML = `
            <div class="product-image">
                <img src="${produto.imagem}" alt="${produto.nome}">
            </div>

            <div class="product-info">
                <span class="product-category">${nomesCategoria[produto.categoria] || produto.categoria}</span>

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

                <p class="stock ${disponivel ? "" : "indisponivel"}">
                    ${disponivel ? `Estoque disponível: ${produto.estoque}` : "Produto sem estoque"}
                </p>

                <button class="add-cart">
                    Adicionar ao carrinho
                </button>
            </div>
        `;

        const botaoCarrinho = card.querySelector(".add-cart");

        if (!disponivel) {
            botaoCarrinho.disabled = true;
            botaoCarrinho.textContent = "Sem estoque";
        }

        botaoCarrinho.addEventListener("click", () => {
            adicionarAoCarrinho(produto.codigo);
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

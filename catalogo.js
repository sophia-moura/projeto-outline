// Catálogo compartilhado por produtos.html e carrinho.html.
// Fonte única de nome, preço, imagem e estoque no front-end.
// (O backend continua sendo a fonte definitiva na finalização.)

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
    new Produto("OUT-001", "Mochila Vinho", "mochilas", 500.00, 10, "imagens/jpg/mochilavinho.jpg"),
    new Produto("OUT-002", "Caderno Azul", "cadernos", 39.90, 15, "imagens/jpg/cadernoazul.jpg"),
    new Produto("OUT-003", "Kit de Canetas Coloridas", "canetas", 29.90, 20, "imagens/jpg/kitcanetas.jpg"),
    new Produto("OUT-004", "Chaveiros", "chaveiros", 19.90, 25, "imagens/png/chaveiros.png"),
    new Produto("OUT-005", "Estojo Preto", "estojos", 59.90, 10, "imagens/jpg/estojopreto.jpg"),
    new Produto("OUT-006", "Kit de Lápis de Cor", "lapis", 50.00, 50, "imagens/jpg/kitlapis.jpg"),
    new Produto("OUT-007", "Mochila Azul", "mochilas", 349.90, 0, "imagens/jpg/mochilaazul.jpg"),
    new Produto("OUT-008", "Necessaire Rosa", "necessaires", 69.90, 20, "imagens/jpg/necessarierosa.jpg"),
    new Produto("OUT-009", "Kit de Necessaires", "necessaires", 89.90, 10, "imagens/jpg/kitnecessaries.jpg"),
    new Produto("OUT-010", "Mochila Preta", "mochilas", 399.90, 10, "imagens/jpg/mochilapreta.jpg")
];

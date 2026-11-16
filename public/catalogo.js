class Produto {
    constructor(dados) {
        this.codigo = dados.codigo;
        this.nome = dados.nome;
        this.categoria = dados.categoria;
        this.categoriaNome = dados.categoria_nome;
        this.preco = Number(dados.preco);
        this.estoque = Number(dados.estoque);
        this.imagem = dados.imagem;
        this.ativo = Boolean(dados.ativo);
    }

    disponivel() {
        return this.estoque > 0;
    }

    reduzirEstoque(quantidade) {
        this.estoque -= quantidade;
    }
}

let produtos = [];
let categorias = [];
let nomesCategoria = {};

let catalogoCarregando = null;

async function carregarCatalogo() {
    if (catalogoCarregando) {
        return catalogoCarregando;
    }

    catalogoCarregando = (async () => {
        try {
            const [respostaCategorias, respostaProdutos] = await Promise.all([
                fetch("/api/categorias"),
                fetch("/api/produtos")
            ]);

            if (!respostaCategorias.ok || !respostaProdutos.ok) {
                throw new Error("Não foi possível carregar o catálogo.");
            }

            const dadosCategorias = await respostaCategorias.json();
            const dadosProdutos = await respostaProdutos.json();

            categorias = dadosCategorias;

            nomesCategoria = {};

            categorias.forEach(categoria => {
                nomesCategoria[categoria.slug] = categoria.nome;
            });

            produtos = dadosProdutos.map(dados => new Produto(dados));

            return produtos;

        } catch (erro) {
            catalogoCarregando = null;
            console.error("Erro ao carregar o catálogo:", erro);
            throw erro;
        }
    })();

    return catalogoCarregando;
}

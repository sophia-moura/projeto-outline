const PERFIS = {
    cliente: "Cliente",
    admin: "Administrador"
};

class ErroSessao extends Error {}

const formatarMoeda = valor =>
    `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;

const formatarData = texto => {
    const data = new Date(texto);

    if (Number.isNaN(data.getTime())) {
        return "Data indisponível";
    }

    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
};

const criarElemento = (tag, classe, texto) => {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
};

const limparContainer = container => {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

const mostrarMensagem = (container, texto) => {
    limparContainer(container);
    container.appendChild(criarElemento("p", "", texto));
};

const redirecionarParaLogin = () => {
    window.location.href = "login.html?retorno=PaginaCliente.html";
};

class Pedido {
    constructor(dados) {
        this.id = dados.id;
        this.data = dados.data;
        this.situacao = dados.situacao;
        this.subtotal = Number(dados.subtotal);
        this.desconto = Number(dados.desconto);
        this.valorFinal = Number(dados.valor_final);
        this.clienteId = dados.cliente.id;
        this.itens = dados.itens;
    }

    temDesconto() {
        return this.desconto > 0;
    }

    quantidadeTotal() {
        let total = 0;

        for (const item of this.itens) {
            total += item.quantidade;
        }

        return total;
    }
}

class HistoricoPedidos {
    constructor(container, usuario) {
        this.container = container;
        this.usuario = usuario;
        this.pedidos = [];
    }

    async buscar() {
        let resposta;

        try {
            resposta = await fetch("/api/pedidos", {
                headers: {
                    "Authorization": `Bearer ${Auth.token()}`
                }
            });
        } catch (erro) {
            throw new Error("Não foi possível se comunicar com o servidor. Verifique sua conexão.");
        }

        if (resposta.status === 401) {
            throw new ErroSessao();
        }

        if (!resposta.ok) {
            const corpo = await resposta.json().catch(() => ({}));
            throw new Error(corpo.erro || "Não foi possível carregar o histórico de pedidos.");
        }

        const dados = await resposta.json();
        const pedidos = [];

        for (const dado of dados) {
            if (dado.cliente.id === this.usuario.id) {
                pedidos.push(new Pedido(dado));
            }
        }

        this.pedidos = pedidos;
    }

    criarCartao(pedido) {
        const cartao = criarElemento("article", "pedido-item");

        const topo = criarElemento("div", "pedido-topo");
        topo.append(
            criarElemento("span", "", `Pedido #${pedido.id} — ${formatarData(pedido.data)}`),
            criarElemento("span", "", pedido.situacao)
        );

        const lista = criarElemento("ul", "pedido-itens");

        for (const item of pedido.itens) {
            const descricao = `${item.quantidade}x ${item.nome} — ${formatarMoeda(item.preco_unitario)} cada · ${formatarMoeda(item.subtotal)}`;
            lista.appendChild(criarElemento("li", "", descricao));
        }

        cartao.append(
            topo,
            lista,
            criarElemento("p", "", `Itens: ${pedido.quantidadeTotal()}`),
            criarElemento("p", "", `Subtotal: ${formatarMoeda(pedido.subtotal)}`)
        );

        if (pedido.temDesconto()) {
            cartao.appendChild(
                criarElemento("p", "", `Desconto: -${formatarMoeda(pedido.desconto)}`)
            );
        }

        const total = criarElemento("p");
        total.append(
            criarElemento("strong", "", "Total: "),
            document.createTextNode(formatarMoeda(pedido.valorFinal))
        );

        cartao.appendChild(total);

        return cartao;
    }

    renderizar() {
        if (this.pedidos.length === 0) {
            mostrarMensagem(this.container, "Você ainda não realizou nenhuma compra.");
            return;
        }

        limparContainer(this.container);

        for (const pedido of this.pedidos) {
            this.container.appendChild(this.criarCartao(pedido));
        }
    }

    mostrarErro(texto) {
        mostrarMensagem(this.container, texto);

        const botao = criarElemento("button", "", "Tentar novamente");
        botao.type = "button";
        botao.addEventListener("click", () => this.carregar());

        this.container.appendChild(botao);
    }

    async carregar() {
        mostrarMensagem(this.container, "Carregando pedidos...");

        try {
            await this.buscar();
            this.renderizar();
        } catch (erro) {
            if (erro instanceof ErroSessao) {
                await Auth.sair();
                mostrarMensagem(this.container, "Sua sessão expirou. Faça login novamente.");
                setTimeout(redirecionarParaLogin, 1500);
                return;
            }

            this.mostrarErro(erro.message);
        }
    }
}

const renderizarDadosCliente = (container, usuario) => {
    limparContainer(container);

    const campos = [
        ["Nome", usuario.nome],
        ["E-mail", usuario.email],
        ["Perfil", PERFIS[usuario.perfil] || usuario.perfil]
    ];

    for (const [rotulo, valor] of campos) {
        const linha = criarElemento("p");
        linha.append(
            criarElemento("strong", "", `${rotulo}: `),
            document.createTextNode(valor)
        );
        container.appendChild(linha);
    }
};

const iniciarPaginaCliente = () => {
    const dadosCliente = document.getElementById("dados-cliente");
    const listaPedidos = document.getElementById("lista-pedidos");

    if (!Auth.estaLogado()) {
        const aviso = "É necessário fazer login para acessar sua conta. Redirecionando...";

        mostrarMensagem(dadosCliente, aviso);
        mostrarMensagem(listaPedidos, aviso);
        setTimeout(redirecionarParaLogin, 1500);
        return;
    }

    const usuario = Auth.usuario();

    renderizarDadosCliente(dadosCliente, usuario);

    const historico = new HistoricoPedidos(listaPedidos, usuario);
    historico.carregar();
};

document.addEventListener("DOMContentLoaded", iniciarPaginaCliente);
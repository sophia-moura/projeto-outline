// Sessão do usuário
// "estar logado" é apenas um registro no localStorage
const Auth = {
    CHAVE: "usuarioLogado",
    PAGINAS_RETORNO_PERMITIDAS: ["carrinho.html", "produtos.html", "index.html"],

    usuario() {
        try {
            return JSON.parse(localStorage.getItem(this.CHAVE));
        } catch (erro) {
            return null;
        }
    },

    estaLogado() {
        return this.usuario() !== null;
    },

    entrar(usuario) {
        localStorage.setItem(this.CHAVE, JSON.stringify(usuario));
    },

    sair() {
        // Remove só a sessão: a chave "carrinho" permanece intacta.
        localStorage.removeItem(this.CHAVE);
    },

    // Lê ?retorno=carrinho.html da URL. Só aceita páginas da lista acima
    paginaRetorno() {
        const retorno = new URLSearchParams(window.location.search).get("retorno");
        return this.PAGINAS_RETORNO_PERMITIDAS.includes(retorno) ? retorno : "index.html";
    }
};

function renderizarConta() {
    const visitante = document.getElementById("guest-actions");
    const logado = document.getElementById("user-actions");
    const nome = document.getElementById("user-name");

    if (!visitante || !logado) {
        return;
    }

    const usuario = Auth.usuario();

    visitante.hidden = usuario !== null;
    logado.hidden = usuario === null;

    if (usuario) {
        nome.textContent = `Olá, ${usuario.nome}`;
    }
}

// Mantém o contador do carrinho do cabeçalho correto em qualquer página
function sincronizarContadorHeader() {
    const contador = document.getElementById("cart-count");

    if (!contador) {
        return;
    }

    let itens = [];

    try {
        itens = JSON.parse(localStorage.getItem("carrinho")) || [];
    } catch (erro) {
        itens = [];
    }

    contador.textContent = itens.reduce((total, item) => total + (item.quantidade || 0), 0);
}

const botaoSair = document.getElementById("logout-button");

if (botaoSair) {
    botaoSair.addEventListener("click", () => {
        Auth.sair();
        renderizarConta();
    });
}

renderizarConta();
sincronizarContadorHeader();

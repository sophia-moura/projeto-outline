const Auth = {
    CHAVE: "usuarioLogado",
    PAGINAS_RETORNO_PERMITIDAS: ["carrinho.html", "produtos.html", "index.html"],

    usuario() {
        try {
            const sessao = JSON.parse(localStorage.getItem(this.CHAVE));
            return sessao?.usuario || null;
        } catch (erro) {
            return null;
        }
    },

    token() {
        try {
            const sessao = JSON.parse(localStorage.getItem(this.CHAVE));
            return sessao?.token || null;
        } catch (erro) {
            return null;
        }
    },

    estaLogado() {
        return this.usuario() !== null && this.token() !== null;
    },

    entrar(usuario, token) {
        if (!usuario || !token) {
            return false;
        }

        localStorage.setItem(this.CHAVE, JSON.stringify({
            usuario: usuario,
            token: token
        }));

        return true;
    },

    async validarSessao() {
        const token = this.token();

        if (!token) {
            renderizarConta();
            return;
        }

        try {
            const resposta = await fetch("/api/auth/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (resposta.status === 401) {
                this.sair();
                return;
            }

            if (!resposta.ok) {
                renderizarConta();
                return;
            }

            const dados = await resposta.json();

            this.entrar(dados.usuario, token);

        } catch (erro) {
            console.error("Não foi possível verificar a sessão:", erro);
        }

        renderizarConta();
    },

    async sair() {
        const token = this.token();

        if (token) {
            try {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
            } catch (erro) {
                console.error("Não foi possível encerrar a sessão no servidor:", erro);
            }
        }

        localStorage.removeItem(this.CHAVE);

        renderizarConta();
    },

    paginaRetorno() {
        const retorno = new URLSearchParams(window.location.search).get("retorno");

        return this.PAGINAS_RETORNO_PERMITIDAS.includes(retorno)
            ? retorno
            : "index.html";
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
    const estaAutenticado = Auth.estaLogado();
    const linkAdmin = document.getElementById("admin-link");

if (linkAdmin) {
    linkAdmin.hidden = !estaAutenticado || usuario.perfil !== "admin";
}

    visitante.hidden = estaAutenticado;
    logado.hidden = !estaAutenticado;

    if (estaAutenticado && nome) {
        nome.textContent = `Olá, ${usuario.nome}`;
    }
}

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

    contador.textContent = itens.reduce(
        (total, item) => total + (item.quantidade || 0),
        0
    );
}

const botaoSair = document.getElementById("logout-button");

if (botaoSair) {
    botaoSair.addEventListener("click", async () => {
        await Auth.sair();
    });
}

renderizarConta();
sincronizarContadorHeader();
Auth.validarSessao();

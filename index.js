
document.addEventListener("DOMContentLoaded", () => {

    const authArea = document.getElementById("auth-area");

    // Verifica se existe um usuário conectado
    async function verificarUsuario() {

        if (!authArea) {
            console.error("Elemento auth-area não encontrado.");
            return;
        }

        try {
            const resposta = await fetch("/api/usuario", {
                method: "GET",
                credentials: "same-origin"
            });

            if (!resposta.ok) {
                mostrarVisitante();
                return;
            }

            const dados = await resposta.json();

            if (dados.usuario) {
                mostrarUsuario(dados.usuario);
            } else {
                mostrarVisitante();
            }

        } catch (erro) {
            console.error("Erro ao verificar usuário:", erro);
            mostrarVisitante();
        }
    }

    // Exibe as opções para quem ainda não entrou
    function mostrarVisitante() {

        authArea.innerHTML = `
            <a href="login.html" class="auth-link">
                Entrar
            </a>

            <a href="cadastro.html" class="btn btn-primary auth-register">
                Criar conta
            </a>
        `;
    }

    // Exibe o nome do usuário conectado
    function mostrarUsuario(usuario) {

        authArea.innerHTML = "";

        const saudacao = document.createElement("span");
        saudacao.className = "user-greeting";
        saudacao.textContent = `Olá, ${usuario.nome}!`;

        const botaoSair = document.createElement("button");
        botaoSair.type = "button";
        botaoSair.className = "auth-logout";
        botaoSair.textContent = "Sair";

        botaoSair.addEventListener("click", sairDaConta);

        authArea.appendChild(saudacao);
        authArea.appendChild(botaoSair);
    }

    // Encerra a sessão do usuário
    async function sairDaConta() {

        try {
            const resposta = await fetch("/api/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem || "Não foi possível sair da conta."
                );
            }

            alert("Você saiu da sua conta!");

            window.location.reload();

        } catch (erro) {
            console.error("Erro ao sair:", erro);

            alert(
                erro.message || "Erro ao encerrar a sessão."
            );
        }
    }

    // Verifica o usuário ao carregar a página
    verificarUsuario();

});

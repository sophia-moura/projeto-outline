
const formulario = document.getElementById("cadastro-form");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    // Verifica se as senhas são iguais
    if (senha !== confirmarSenha) {
        mensagem.textContent = "As senhas não são iguais.";
        mensagem.style.color = "red";
        return;
    }

    // Verifica o tamanho da senha
    if (senha.length < 6 || senha.length > 72) {
        mensagem.textContent = "A senha deve ter entre 6 e 72 caracteres.";
        mensagem.style.color = "red";
        return;
    }

    try {
        mensagem.textContent = "Realizando cadastro...";
        mensagem.style.color = "gray";

        // Envia os dados para a API
        const resposta = await fetch("/api/cadastro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                email: email,
                senha: senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Erro ao realizar cadastro.");
        }

        mensagem.textContent = "Cadastro realizado com sucesso! Você já pode fazer login.";
        mensagem.style.color = "green";

        formulario.reset();

    } catch (erro) {
        mensagem.textContent = erro.message;
        mensagem.style.color = "red";
    }
});

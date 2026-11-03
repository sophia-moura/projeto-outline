
const formulario = document.getElementById("login-form");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    try {
        mensagem.textContent = "Verificando seus dados...";
        mensagem.style.color = "gray";

        const resposta = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível realizar o login.");
        }

        mensagem.textContent = "Login realizado com sucesso!";
        mensagem.style.color = "green";

        // Redireciona para a página inicial
        window.location.href = "index.html";

    } catch (erro) {
        mensagem.textContent = erro.message;
        mensagem.style.color = "red";
    }
});

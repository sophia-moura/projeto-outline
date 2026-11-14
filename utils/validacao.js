const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_PRODUTO = /^[A-Za-z0-9-]{1,20}$/;

class ErroNegocio extends Error {
    constructor(status, mensagem, detalhes) {
        super(mensagem);
        this.status = status;
        this.detalhes = detalhes;
    }
}

const textoValido = (valor, minimo, maximo) =>
    typeof valor === "string" &&
    valor.trim().length >= minimo &&
    valor.trim().length <= maximo;

const emailValido = valor => typeof valor === "string" && EMAIL.test(valor.trim());

const codigoValido = valor => typeof valor === "string" && CODIGO_PRODUTO.test(valor);

const inteiroNaoNegativo = valor => Number.isInteger(valor) && valor >= 0;

const inteiroPositivo = valor => Number.isInteger(valor) && valor > 0;

const precoValido = valor =>
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0 &&
    valor < 100000000 &&
    Math.round(valor * 100) / 100 === valor;

const paraCentavos = valor => Math.round(valor * 100);

const paraReais = centavos => centavos / 100;

const responderErroNegocio = (res, erro) => {
    const corpo = { erro: erro.message };

    if (erro.detalhes) {
        corpo.detalhes = erro.detalhes;
    }

    res.status(erro.status).json(corpo);
};

module.exports = {
    ErroNegocio,
    textoValido,
    emailValido,
    codigoValido,
    inteiroNaoNegativo,
    inteiroPositivo,
    precoValido,
    paraCentavos,
    paraReais,
    responderErroNegocio
};

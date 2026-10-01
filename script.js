/* ==========================================================================
   MOBILIDADE INDUSTRIAL - SCRIPT PRINCIPAL
   ========================================================================== */

// Base de Dados Simulada do Portal
const dadosPortal = {
    horarios: [
        { ponto: "Ponto Central - Polo Industrial", linha: "Linha 101 - Centro / Distrito A", proximos: ["06:15", "06:45", "07:15", "07:45"] },
        { ponto: "Ponto Central - Polo Industrial", linha: "Linha 202 - Terminal Norte / Fretado B", proximos: ["06:30", "07:00", "07:30", "08:00"] },
        { ponto: "Av. das Indústrias, 500", linha: "Linha 303 - Bairro Sul / Indústria C", proximos: ["05:50", "06:20", "06:50", "07:20"] }
    ],
    linhas: [
        {
            codigo: "101",
            nome: "Linha 101 - Centro / Distrito Industrial A",
            tipo: "Regular / Fretado Geral",
            trajeto: "Terminal Central ➔ Av. Principal ➔ Rua dos Trabalhadores ➔ Polo Industrial A",
            pontos: [
                "Terminal Central (Plataforma 4)",
                "Av. Principal, 120 (Frente ao Supermercado)",
                "Rua dos Trabalhadores, 45",
                "Portaria Principal - Polo Industrial A"
            ],
            paradasMapa: [
                "01. Terminal Central",
                "02. Av. Principal",
                "03. Rua dos Trabalhadores",
                "04. Distrito Industrial A"
            ]
        }
    ]
};

// Inicialização após o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
    marcarLinkNavegacaoAtivo();
    inicializarPaginaHorarios();
    inicializarPaginaLinhas();
    inicializarPaginaContato();
    inicializarPaginaDicas();
});

/* ==========================================================================
   1. NAVEGAÇÃO E UTILS
   ========================================================================== */

// Destaca o menu da página onde o utilizador se encontra
function marcarLinkNavegacaoAtivo() {
    const paginaAtual = window.location.pathname.split("/").pop() || "index.html";
    const linksNav = document.querySelectorAll(".barraNavegacaoPrincipal a");

    linksNav.forEach(link => {
        const href = link.getAttribute("href");
        if (href === paginaAtual) {
            link.style.borderBottom = "2px solid #389cd8";
            link.style.color = "#389cd8";
        }
    });
}

/* ==========================================================================
   2. FUNCIONALIDADE: CONSULTA DE HORÁRIOS (horarios.html)
   ========================================================================== */
function inicializarPaginaHorarios() {
    const btnBuscar = document.getElementById("btnBuscar");
    const inputPonto = document.querySelector("#areaCampoEBotao input");
    const containerResultados = document.getElementById("areaResultadosHorarios");

    if (!btnBuscar || !inputPonto) return;

    function executarPesquisaHorarios() {
        const termoBusca = inputPonto.value.trim().toLowerCase();
        
        if (!termoBusca) {
            alert("Por favor, digite o nome de um ponto ou código da linha.");
            return;
        }

        // Filtra os horários com base no termo pesquisado
        const resultados = dadosPortal.horarios.filter(h => 
            h.ponto.toLowerCase().includes(termoBusca) || 
            h.linha.toLowerCase().includes(termoBusca)
        );

        renderizarHorarios(resultados, termoBusca);
    }

    btnBuscar.addEventListener("click", executarPesquisaHorarios);
    inputPonto.addEventListener("keypress", (e) => {
        if (e.key === "Enter") executarPesquisaHorarios();
    });
}

function renderizarHorarios(lista, termo) {
    const container = document.getElementById("areaResultadosHorarios");
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: white;">
                <h3>Nenhum horário encontrado para "${termo}".</h3>
                <p>Tente pesquisar por "Ponto Central" ou "101".</p>
            </div>
        `;
        return;
    }

    const pontoExibido = lista[0].ponto;

    let html = `
        <div id="cabecalhoPonto">
            <h2>Ponto de Embarque Selecionado:</h2>
            <h3>${pontoExibido}</h3>
        </div>
        <div id="gridLinhasHorarios">
    `;

    lista.forEach(item => {
        html += `
            <article class="cardLinha">
                <h4>${item.linha}</h4>
                <p class="tituloProximas">Próximas Partidas</p>
                <div class="gradeHorarios">
                    ${item.proximos.map(hora => `<span>${hora}</span>`).join("")}
                </div>
            </article>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

/* ==========================================================================
   3. FUNCIONALIDADE: LINHAS E ROTAS (linhas.html)
   ========================================================================== */
function inicializarPaginaLinhas() {
    const btnBuscarLinha = document.getElementById("btnBuscarLinha");
    const inputLinha = document.querySelector("#areaCampoEBotaoLinha input");

    if (!btnBuscarLinha || !inputLinha) return;

    btnBuscarLinha.addEventListener("click", () => {
        const termo = inputLinha.value.trim().toLowerCase();
        if (!termo) {
            alert("Digite o nome ou número da linha.");
            return;
        }

        const linhaEncontrada = dadosPortal.linhas.find(l => 
            l.codigo.includes(termo) || l.nome.toLowerCase().includes(termo)
        );

        if (linhaEncontrada) {
            atualizarDetalhesRota(linhaEncontrada);
        } else {
            alert("Linha não encontrada. Tente buscar por '101'.");
        }
    });
}

function atualizarDetalhesRota(linha) {
    const tituloLinha = document.querySelector("#cabecalhoDetalhesRota h2");
    const passosTrajeto = document.querySelector(".passosTrajeto");
    const listaPontos = document.querySelector(".seccaoPontosEmbarque ul");
    const listaMapa = document.querySelector(".pontosNoMapa ol");

    if (tituloLinha) tituloLinha.textContent = linha.nome;
    if (passosTrajeto) passosTrajeto.textContent = linha.trajeto;
    
    if (listaPontos) {
        listaPontos.innerHTML = linha.pontos.map(p => `<li>• ${p}</li>`).join("");
    }

    if (listaMapa) {
        listaMapa.innerHTML = linha.paradasMapa.map(m => `<li>${m}</li>`).join("");
    }
}

/* ==========================================================================
   4. FUNCIONALIDADE: FORMULÁRIO DE CONTACTO (contato.html)
   ========================================================================== */
function inicializarPaginaContato() {
    const formContato = document.getElementById("formContato");
    if (!formContato) return;

    formContato.addEventListener("submit", (event) => {
        event.preventDefault(); // Impede o recarregamento da página

        const nome = document.getElementById("nome")?.value || "Utilizador";
        const email = document.getElementById("email")?.value;
        const mensagem = document.getElementById("mensagem")?.value;

        if (!email || !mensagem) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Simulação de envio com sucesso
        alert(`Obrigado, ${nome}! A sua mensagem foi enviada com sucesso. Entraremos em contacto brevemente.`);
        formContato.reset();
    });
}

/* ==========================================================================
   5. FUNCIONALIDADE: DICAS DE MOBILIDADE (dicas.html)
   ========================================================================== */
function inicializarPaginaDicas() {
    const btnVerMais = document.querySelector(".btnVerMaisDicas");
    if (!btnVerMais) return;

    btnVerMais.addEventListener("click", () => {
        const gridDicas = document.querySelector(".gridDicas");
        
        // Adiciona novos cards dinamicamente ao clicar em "Ver mais dicas"
        const novasDicas = [
            { titulo: "Atenção aos Crachás", desc: "Mantenha o seu crachá de identificação industrial visível ao embarcar nos fretados das empresas." },
            { titulo: "Dias de Chuva", desc: "Em dias chuvosos, os horários podem sofrer pequenos atrasos. Acompanhe os alertas no portal." },
            { titulo: "Achados e Perdidos", desc: "Esqueceu algo no autocarro? Entre em contacto imediato na secção de contacto do portal." }
        ];

        novasDicas.forEach(dica => {
            const card = document.createElement("article");
            card.className = "cardDica";
            card.innerHTML = `
                <h3>${dica.titulo}</h3>
                <p>${dica.desc}</p>
            `;
            gridDicas.appendChild(card);
        });

        btnVerMais.style.display = "none"; // Esconde o botão após carregar todas
    });
}
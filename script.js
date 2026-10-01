/* ==========================================================================
   MOBILIDADE INDUSTRIAL - SCRIPT PRINCIPAL
   ========================================================================== */

// Base de dados simulada do portal
const bancoDadosTransporte = {
    linhas: [
        {
            codigo: "101",
            nome: "Linha 101 - Centro / Distrito Industrial A",
            status: "Normal",
            empresa: "TransIndustrial",
            trajeto: "Terminal Central ➔ Av. Principal ➔ Rua dos Trabalhadores ➔ Polo Industrial A",
            horarios: ["06:15", "06:45", "07:15", "07:45", "08:15", "17:15", "18:00"],
            pontos: [
                { nome: "Terminal Central (Plataforma 4)", lat: -22.5645, lng: -47.4021 },
                { nome: "Av. Principal, 120 (Frente ao Supermercado)", lat: -22.5680, lng: -47.4050 },
                { nome: "Rua dos Trabalhadores, 45", lat: -22.5710, lng: -47.4090 },
                { nome: "Portaria Principal - Polo Industrial A", lat: -22.5750, lng: -47.4120 }
            ],
            paradasMapa: [
                "01. Terminal Central",
                "02. Av. Principal",
                "03. Rua dos Trabalhadores",
                "04. Distrito Industrial A"
            ]
        },
        {
            codigo: "202",
            nome: "Linha 202 - Terminal Norte / Fretado B",
            status: "Com Atraso (10 min)",
            empresa: "Viação Polo",
            trajeto: "Terminal Norte ➔ Rodovia Sul ➔ Entrada Secundária - Polo Industrial B",
            horarios: ["06:00", "06:30", "07:00", "07:30", "17:30", "18:15"],
            pontos: [
                { nome: "Terminal Norte", lat: -22.5500, lng: -47.3950 },
                { nome: "Rodovia Sul - KM 12", lat: -22.5580, lng: -47.3990 },
                { nome: "Polo Industrial B", lat: -22.5790, lng: -47.4150 }
            ],
            paradasMapa: [
                "01. Terminal Norte",
                "02. Rodovia Sul",
                "03. Polo Industrial B"
            ]
        }
    ]
};

// Inicialização das funções ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    marcarNavegacaoAtiva();
    inicializarHorariosDinamicos();
    inicializarLinhasEMapa();
    inicializarContato();
    inicializarDicas();
});

/* ==========================================================================
   1. NAVEGAÇÃO E MENU ATIVO
   ========================================================================== */
function marcarNavegacaoAtiva() {
    const paginaAtual = window.location.pathname.split("/").pop() || "index.html";
    const linksNav = document.querySelectorAll(".barraNavegacaoPrincipal a");

    linksNav.forEach(link => {
        if (link.getAttribute("href") === paginaAtual) {
            link.style.color = "#389cd8";
            link.style.borderBottom = "2px solid #389cd8";
        }
    });
}

/* ==========================================================================
   2. PÁGINA: HORÁRIOS (FILTRO E CÁLCULO DE TEMPO RESTANTE)
   ========================================================================== */
function inicializarHorariosDinamicos() {
    const inputPonto = document.querySelector("#areaCampoEBotao input");
    const btnBuscar = document.getElementById("btnBuscar");

    if (!inputPonto) return;

    function executarFiltroHorarios() {
        const termo = inputPonto.value.toLowerCase().trim();
        const resultados = bancoDadosTransporte.linhas.filter(linha => 
            linha.nome.toLowerCase().includes(termo) ||
            linha.codigo.includes(termo) ||
            linha.pontos.some(p => p.nome.toLowerCase().includes(termo))
        );

        renderizarCartoesHorarios(resultados, termo);
    }

    inputPonto.addEventListener("input", executarFiltroHorarios);
    if (btnBuscar) btnBuscar.addEventListener("click", executarFiltroHorarios);
}

function renderizarCartoesHorarios(linhas, termo) {
    const container = document.getElementById("areaResultadosHorarios");
    if (!container) return;

    if (linhas.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: white;">
                <h3>Nenhum horário encontrado para "${termo}".</h3>
                <p>Tente pesquisar por "Centro" ou "101".</p>
            </div>`;
        return;
    }

    let html = `
        <div id="cabecalhoPonto">
            <h2>Ponto de Embarque / Linhas Encontradas:</h2>
            <h3>Exibindo ${linhas.length} resultado(s)</h3>
        </div>
        <div id="gridLinhasHorarios">
    `;

    linhas.forEach(linha => {
        const proximoHorario = calcularProximaPartida(linha.horarios);

        html += `
            <article class="cardLinha">
                <h4>${linha.nome}</h4>
                <p style="font-size:0.85rem; color:${linha.status.includes('Atraso') ? '#d9534f' : '#28a745'}; font-weight:bold; margin-bottom:10px;">
                    Status: ${linha.status}
                </p>
                <div style="background-color: #0c3d66; color: white; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem;">
                    Próxima saída: <strong>${proximoHorario}</strong>
                </div>
                <p class="tituloProximas">Horários do Dia</p>
                <div class="gradeHorarios">
                    ${linha.horarios.map(h => `<span>${h}</span>`).join("")}
                </div>
            </article>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function calcularProximaPartida(horarios) {
    const agora = new Date();
    const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();

    for (let horaStr of horarios) {
        const [h, m] = horaStr.split(":").map(Number);
        const minutosLinha = h * 60 + m;

        if (minutosLinha > horaAtualMinutos) {
            const diferenca = minutosLinha - horaAtualMinutos;
            return `${horaStr} (em ${diferenca} min)`;
        }
    }
    return horarios[0] + " (Amanhã)";
}

/* ==========================================================================
   3. PÁGINA: LINHAS E ROTAS (MAPA E PESQUISA)
   ========================================================================== */
let mapaLeaflet = null;
let marcadoresMapa = [];

function inicializarLinhasEMapa() {
    const containerMapa = document.getElementById("mapaInterativo");
    const inputLinha = document.querySelector("#areaCampoEBotaoLinha input");
    const btnBuscarLinha = document.getElementById("btnBuscarLinha");

    // Inicializa o mapa com Leaflet se a biblioteca estiver presente na página
    if (containerMapa && typeof L !== "undefined") {
        mapaLeaflet = L.map("mapaInterativo").setView([-22.5645, -47.4021], 13);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
        }).addTo(mapaLeaflet);

        carregarLinhaNoMapa(bancoDadosTransporte.linhas[0]);
    }

    function buscarLinha() {
        if (!inputLinha) return;
        const termo = inputLinha.value.toLowerCase().trim();
        const linhaEncontrada = bancoDadosTransporte.linhas.find(l => 
            l.codigo.includes(termo) || l.nome.toLowerCase().includes(termo)
        );

        if (linhaEncontrada) {
            carregarLinhaNoMapa(linhaEncontrada);
        } else if (termo !== "") {
            alert("Linha não encontrada. Tente pesquisar por '101' ou '202'.");
        }
    }

    if (inputLinha) inputLinha.addEventListener("input", buscarLinha);
    if (btnBuscarLinha) btnBuscarLinha.addEventListener("click", buscarLinha);
}

function carregarLinhaNoMapa(linha) {
    // Atualiza os textos da tela
    const tituloLinha = document.querySelector("#cabecalhoDetalhesRota h2");
    const passosTrajeto = document.querySelector(".passosTrajeto");
    const listaPontos = document.querySelector(".seccaoPontosEmbarque ul");
    const listaMapa = document.querySelector(".pontosNoMapa ol");

    if (tituloLinha) tituloLinha.textContent = linha.nome;
    if (passosTrajeto) passosTrajeto.textContent = linha.trajeto;
    
    if (listaPontos) {
        listaPontos.innerHTML = linha.pontos.map(p => `<li>• ${p.nome}</li>`).join("");
    }

    if (listaMapa && linha.paradasMapa) {
        listaMapa.innerHTML = linha.paradasMapa.map(m => `<li>${m}</li>`).join("");
    }

    // Desenha os pontos no mapa se o Leaflet estiver ativo
    if (mapaLeaflet) {
        marcadoresMapa.forEach(m => mapaLeaflet.removeLayer(m));
        marcadoresMapa = [];

        const coordenadas = [];

        linha.pontos.forEach(ponto => {
            const marker = L.marker([ponto.lat, ponto.lng])
                .addTo(mapaLeaflet)
                .bindPopup(`<b>${ponto.nome}</b><br>Linha: ${linha.codigo}`);
            
            marcadoresMapa.push(marker);
            coordenadas.push([ponto.lat, ponto.lng]);
        });

        if (coordenadas.length > 1) {
            const polyline = L.polyline(coordenadas, { color: "#389cd8", weight: 5 }).addTo(mapaLeaflet);
            marcadoresMapa.push(polyline);
            mapaLeaflet.fitBounds(polyline.getBounds());
        }
    }
}

/* ==========================================================================
   4. PÁGINA: CONTATO (VALIDAÇÃO E ENVIO DE FORMULÁRIO)
   ========================================================================== */
function inicializarContato() {
    const form = document.getElementById("formContato");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const nome = document.getElementById("nome")?.value || "Usuário";
        const email = document.getElementById("email")?.value;
        const mensagem = document.getElementById("mensagem")?.value;

        if (!email || !mensagem) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const btnSubmit = document.getElementById("btnEnviarMensagem") || form.querySelector("button[type='submit']");
        if (btnSubmit) {
            btnSubmit.textContent = "Enviando...";
            btnSubmit.disabled = true;
        }

        setTimeout(() => {
            alert(`Obrigado, ${nome}! Sua mensagem foi enviada com sucesso para a equipe de Mobilidade.`);
            form.reset();
            if (btnSubmit) {
                btnSubmit.textContent = "Enviar Mensagem";
                btnSubmit.disabled = false;
            }
        }, 1000);
    });
}

/* ==========================================================================
   5. PÁGINA: DICAS DE MOBILIDADE
   ========================================================================== */
function inicializarDicas() {
    const btnVerMais = document.querySelector(".btnVerMaisDicas");
    if (!btnVerMais) return;

    btnVerMais.addEventListener("click", () => {
        const gridDicas = document.querySelector(".gridDicas");
        
        const novasDicas = [
            { titulo: "Atenção aos Crachás", desc: "Mantenha o seu crachá de identificação industrial visível ao embarcar nos fretados das empresas." },
            { titulo: "Dias de Chuva", desc: "Em dias chuvosos, os horários podem sofrer pequenos atrasos. Acompanhe os alertas no portal." },
            { titulo: "Achados e Perdidos", desc: "Esqueceu algo no ônibus? Entre em contato imediato na seção de contato do portal." }
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

        btnVerMais.style.display = "none";
    });
}
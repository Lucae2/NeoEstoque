/* NEOESTOQUE
   ================================================================= */



/* =================================================================
   UNÇÕES UTILITÁRIAS E LOCALSTORAGE
   ================================================================= */

// Ler o estoque do LS
function getEstoque() {
    return JSON.parse(localStorage.getItem('neoEstoqueDB')) || [];
}

// Salvar a lista no LS
function saveEstoque(lista) {
    localStorage.setItem('neoEstoqueDB', JSON.stringify(lista));
}

// Registrar uma movimentação no histórico
function registrarHistorico(item, tipo, qtd, usuario = "Ana Silva") {
    let historico = JSON.parse(localStorage.getItem('neoHistoricoDB')) || [];
    const dataAtual = new Date();
    
    const novoRegistro = {
        data: dataAtual.toLocaleDateString() + ' ' + dataAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        item: item,
        tipo: tipo,
        qtd: qtd,
        usuario: usuario
    };
    
    historico.unshift(novoRegistro); // Adiciona no topo da lista
    localStorage.setItem('neoHistoricoDB', JSON.stringify(historico));
}

//=================================================================
// INTERFACE GRAFICA
//=================================================================

// Desenha os cards de produtos na tela
function renderizarEstoque(lista, elementoContainer) {
    elementoContainer.innerHTML = ''; 

    if (lista.length === 0) {
        elementoContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #777;">Nenhum item encontrado no estoque.</div>';
        return;
    }

    lista.forEach(item => {
        const classeBaixoEstoque = item.quantidade <= 5 ? 'low-stock' : '';
        const preco = parseFloat(item.preco);

        const cardHTML = `
        <div class="card stock-item-card" id="item-${item.id}">
            <div class="item-photo">
                <img src="${item.imagem}" alt="${item.nome}">
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h4 class="item-name">${item.nome}</h4>
                    <span class="item-category">${item.categoria}</span>
                </div>
                <p class="item-description">${item.descricao}</p>
                
                <div class="item-stats">
                    <div class="stat">
                        <span class="${classeBaixoEstoque}">Quantidade</span>
                        
                        <div class="qtd-control">
                            <button onclick="atualizarQuantidade(${item.id}, -1)" class="btn-qtd minus">-</button>
                            
                            <input type="number" 
                                   class="qtd-input ${classeBaixoEstoque}" 
                                   value="${item.quantidade}" 
                                   onchange="alterarQtdManual(${item.id}, this.value)"
                            >
                            
                            <button onclick="atualizarQuantidade(${item.id}, 1)" class="btn-qtd plus">+</button>
                        </div>

                    </div>
                    <div class="stat">
                        <span>Preço</span>
                        <strong>R$ ${preco.toFixed(2)}</strong>
                    </div>
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="deletarItem(${item.id})" style="background: #dc3545; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; flex: 1; font-weight: 500;">Excluir</button>
                </div>
            </div>
        </div>
        `;
        elementoContainer.innerHTML += cardHTML;
    });
}

//=================================================================
// AÇÕES DO USUÁRIO ONCLICK
//=================================================================

// Atualizar quantidade via botões +-
window.atualizarQuantidade = function(id, delta) {
    let estoque = getEstoque();
    const itemIndex = estoque.findIndex(i => i.id === id);

    if (itemIndex !== -1) {
        const item = estoque[itemIndex];
        const novaQtd = parseInt(item.quantidade) + delta;

        if (novaQtd < 0) {
            alert("A quantidade não pode ser menor que zero.");
            return;
        }

        item.quantidade = novaQtd;
        estoque[itemIndex] = item;
        saveEstoque(estoque);

        const tipoMovimento = delta > 0 ? 'Entrada' : 'Saída';
        const usuarioLogado = localStorage.getItem('neoUsuarioLogado') || "Usuário";
        
        registrarHistorico(item.nome, tipoMovimento, delta > 0 ? `+${delta}` : `${delta}`, usuarioLogado);

        location.reload(); 
    }
}

// Atualizar quantidade geral
window.alterarQtdManual = function(id, novoValorStr) {
    let estoque = getEstoque();
    const itemIndex = estoque.findIndex(i => i.id === id);

    if (itemIndex !== -1) {
        const item = estoque[itemIndex];
        const qtdAntiga = parseInt(item.quantidade);
        const novaQtd = parseInt(novoValorStr);

        if (novaQtd < 0 || isNaN(novaQtd)) {
            alert("Quantidade inválida.");
            location.reload(); 
            return;
        }

        const diferenca = novaQtd - qtdAntiga;
        if (diferenca === 0) return; 

        item.quantidade = novaQtd;
        estoque[itemIndex] = item;
        saveEstoque(estoque);

        const tipoMovimento = diferenca > 0 ? 'Entrada' : 'Saída';
        const usuarioLogado = localStorage.getItem('neoUsuarioLogado') || "Usuário";
        const sinal = diferenca > 0 ? '+' : '';
        
        registrarHistorico(item.nome, tipoMovimento, `${sinal}${diferenca}`, usuarioLogado);
        
        console.log("Estoque atualizado manualmente.");
    }
}

// Deletar Item 
window.deletarItem = function(id) {
    if(confirm('Tem certeza que deseja excluir este item?')) {
        let estoque = getEstoque();
        const itemParaApagar = estoque.find(i => i.id === id);
        
        if(itemParaApagar) {
            registrarHistorico(itemParaApagar.nome, 'Saída', 'Exclusão', 'Admin');
        }

        estoque = estoque.filter(item => item.id !== id);
        saveEstoque(estoque);
        location.reload();
    }
}

//=================================================================
//   4. INICIALIZAÇÃO 
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    // A. Verificar Autenticação
    function checkAuth() {
        const usuario = localStorage.getItem('neoUsuarioLogado');
        const paginaAtual = window.location.pathname;
        const paginasPublicas = ['login.html', 'inicio.html'];
        const ehPaginaPublica = paginasPublicas.some(p => paginaAtual.includes(p));

        if (!usuario && !ehPaginaPublica) {
            window.location.href = 'login.html';
        }
    }
    checkAuth();

    // Lógica de Login
    const formLogin = document.querySelector('form[action="index.html"]');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = formLogin.querySelector('input[type="email"]').value;
            const pass = formLogin.querySelector('input[type="password"]').value;
            
            if (email && pass) {
                localStorage.setItem('neoUsuarioLogado', email);
                window.location.href = 'index.html';
            } else {
                alert("Preencha todos os campos.");
            }
        });
    }

    // Barra de Busca e Filtro por Categoria
    const searchBar = document.querySelector('.search-bar input');
    const filterBtn = document.getElementById('filterBtn');
    const categoryMenu = document.getElementById('categoryMenu');
    const dropdownItems = document.querySelectorAll('.dropdown-item');

    // Busca por texto (Enter)
    if (searchBar) {
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                localStorage.setItem('neoBuscaTermo', searchBar.value);
                window.location.href = 'ver-estoque.html';
            }
        });
    }

    // Abrir/Fechar Menu de Categorias
    if (filterBtn && categoryMenu) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede fechamento imediato
            categoryMenu.classList.toggle('active');
        });

        // Fechar menu 2
        document.addEventListener('click', (e) => {
            if (!filterBtn.contains(e.target) && !categoryMenu.contains(e.target)) {
                categoryMenu.classList.remove('active');
            }
        });
    }

    //Clique em uma categoria do menu
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const categoria = item.getAttribute('data-cat');
            
            if (categoria === "") {
                localStorage.removeItem('neoBuscaTermo'); // Se "Todos", limpa busca
            } else {
                localStorage.setItem('neoBuscaTermo', categoria);
            }
            
            window.location.href = 'ver-estoque.html';
        });
    });

    //Adicionar Novo Item
    const formAdicionar = document.querySelector('.add-item-form');
    if (formAdicionar) {
        const inputFoto = document.getElementById('foto');
        const labelFoto = document.querySelector('.photo-uploader-label');
        let imagemBase64 = '';

        //Preview da Imagem
        if(inputFoto) {
            inputFoto.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        imagemBase64 = reader.result;
                        labelFoto.innerHTML = `<img src="${imagemBase64}" style="max-width:100%; max-height: 140px; border-radius: 8px; object-fit: contain;">`;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }

        //Salvar 
        formAdicionar.addEventListener('submit', (e) => {
            e.preventDefault();
            const novoItem = {
                id: Date.now(),
                nome: document.getElementById('nome').value,
                categoria: document.getElementById('categoria').value,
                quantidade: document.getElementById('quantidade').value,
                preco: document.getElementById('preco').value,
                descricao: document.getElementById('descricao').value,
                imagem: imagemBase64 || 'https://via.placeholder.com/300x200.png?text=Sem+Foto'
            };

            const estoque = getEstoque();
            estoque.push(novoItem);
            saveEstoque(estoque);
            registrarHistorico(novoItem.nome, 'Entrada', `+${novoItem.quantidade}`);
            
            alert('Item adicionado!');
            window.location.href = 'ver-estoque.html';
        });
    }

    //Visualizar Estoque - Carregamento Inicial
    const gridEstoque = document.querySelector('.stock-grid');
    if (gridEstoque) {
        let estoque = getEstoque();
        
        // Verifica se tem busca ativa 
        const termoBusca = localStorage.getItem('neoBuscaTermo');
        if (termoBusca) {
            estoque = estoque.filter(item => 
                item.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
                item.categoria.toLowerCase().includes(termoBusca.toLowerCase())
            );
            localStorage.removeItem('neoBuscaTermo'); // Limpa a busca após usar
            
            const headerTitle = document.querySelector('.page-header-card h2');
            if(headerTitle) headerTitle.innerText = `Resultados para: "${termoBusca}"`;
        }

        renderizarEstoque(estoque, gridEstoque);
    }

    // Perfil e Logout
    const btnLogout = document.querySelector('.btn-danger[href="login.html"]');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("Deseja sair?")) {
                localStorage.removeItem('neoUsuarioLogado');
                window.location.href = 'login.html';
            }
        });
        
        // Carrega email no perfil
        const profileEmail = document.querySelector('.profile-summary-card p');
        if (profileEmail) {
            profileEmail.innerText = localStorage.getItem('neoUsuarioLogado') || 'usuario@email.com';
        }
    }

    // Histórico
    const tabelaHistorico = document.querySelector('.history-table tbody');
    if (tabelaHistorico) {
        const historico = JSON.parse(localStorage.getItem('neoHistoricoDB')) || [];
        tabelaHistorico.innerHTML = '';
        
        if (historico.length === 0) {
            tabelaHistorico.innerHTML = '<tr><td colspan="5" style="text-align:center;">Sem registros.</td></tr>';
        } else {
            historico.forEach(reg => {
                const classeTipo = reg.tipo === 'Entrada' ? 'tipo-entrada' : 'tipo-saida';
                tabelaHistorico.innerHTML += `
                    <tr>
                        <td>${reg.data}</td>
                        <td>${reg.item}</td>
                        <td><span class="${classeTipo}">${reg.tipo}</span></td>
                        <td>${reg.qtd}</td>
                        <td>${reg.usuario}</td>
                    </tr>
                `;
            });
        }
    }
});
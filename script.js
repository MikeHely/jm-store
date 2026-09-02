// ============================================
// CONFIGURAÇÕES INICIAIS
// ============================================
const API_URL = 'https://jm-server.onrender.com';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
let tokenJM = localStorage.getItem('tokenJM');
let todosProdutos = [];
let categoriaAtiva = 'todos';
let carrinho = JSON.parse(localStorage.getItem('carrinhoJM')) || [];
let sessionId = localStorage.getItem('sessionId') || `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
let produtoAtualAvaliacao = null;

localStorage.setItem('sessionId', sessionId);

console.log('📡 API_URL:', API_URL);
console.log('👤 Usuário logado:', usuarioLogado);
console.log('🛒 Carrinho:', carrinho);

// ============================================
// FUNÇÃO DE TESTE DE CONEXÃO
// ============================================
async function testarConexao() {
  try {
    console.log('🔄 Testando conexão com o servidor...');
    const res = await fetch(API_URL + '/api/test');
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Servidor online:', data);
      return true;
    } else {
      console.log('❌ Servidor respondeu com status:', res.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return false;
  }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function mostrarToast(mensagem, tipo) {
  tipo = tipo || 'success';
  const container = document.getElementById('toast-container') || criarToastContainer();
  const cores = {
    success: '#16A34A',
    error: '#DC2626',
    warning: '#F59E0B'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${cores[tipo] || cores.success};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    font-weight: bold;
    max-width: 350px;
    z-index: 9999;
  `;
  toast.textContent = mensagem;
  container.appendChild(toast);
  
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function criarToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(container);
  }
  return container;
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Inicializando JM Store...');
  
  // Testar conexão
  const conectado = await testarConexao();
  if (!conectado) {
    mostrarToast('⚠️ Erro de conexão com o servidor. Tente novamente.', 'error');
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = 
        '<p style="color:red; text-align:center;">⚠️ Servidor indisponível. Tente novamente mais tarde.</p>';
    }
    return;
  }
  
  // Carregar dados
  await carregarCategorias();
  await carregarProdutos();
  await carregarFAQ();
  atualizarUIUsuario();
  
  if (usuarioLogado && tokenJM) {
    await carregarCarrinhoServidor();
    await carregarWishlistStatus();
  }
  atualizarContador();
  
  // Registrar visita
  registrarVisita();
  
  // Event listeners
  const linkCadastro = document.getElementById('link-cadastro');
  if (linkCadastro) {
    linkCadastro.addEventListener('click', function(e) {
      e.preventDefault();
      fecharLogin();
      abrirCadastro();
    });
  }
  
  const linkLogin = document.getElementById('link-login');
  if (linkLogin) {
    linkLogin.addEventListener('click', function(e) {
      e.preventDefault();
      fecharCadastro();
      abrirLogin();
    });
  }
  
  const senhaLogin = document.getElementById('senha-login');
  if (senhaLogin) {
    senhaLogin.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') login();
    });
  }
  
  const senhaCadastro = document.getElementById('senha-cadastro');
  if (senhaCadastro) {
    senhaCadastro.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') cadastrar();
    });
  }
  
  console.log('✅ JM Store inicializada com sucesso!');
});

// ============================================
// FUNÇÕES DE MODAIS
// ============================================
function abrirLogin() {
  const modal = document.getElementById('modal-login');
  if (modal) modal.style.display = 'block';
}

function fecharLogin() {
  const modal = document.getElementById('modal-login');
  if (modal) modal.style.display = 'none';
}

function abrirCadastro() {
  const modal = document.getElementById('modal-cadastro');
  if (modal) modal.style.display = 'block';
}

function fecharCadastro() {
  const modal = document.getElementById('modal-cadastro');
  if (modal) modal.style.display = 'none';
}

// ============================================
// FUNÇÃO DE LOGIN
// ============================================
async function login() {
  const emailInput = document.getElementById('email-login');
  const senhaInput = document.getElementById('senha-login');
  
  if (!emailInput || !senhaInput) {
    mostrarToast('Erro: campos de login não encontrados', 'error');
    return;
  }
  
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  
  console.log('🔐 Tentando login:', email);
  
  if (!email || !senha) {
    mostrarToast('Preencha todos os campos', 'error');
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });
    
    console.log('📡 Status da resposta:', res.status);
    
    const data = await res.json();
    console.log('📝 Resposta:', data);
    
    if (res.ok && data.user && data.token) {
      localStorage.setItem('userJM', JSON.stringify(data.user));
      localStorage.setItem('tokenJM', data.token);
      usuarioLogado = data.user;
      tokenJM = data.token;
      fecharLogin();
      atualizarUIUsuario();
      await carregarCarrinhoServidor();
      await carregarWishlistStatus();
      atualizarContador();
      mostrarToast('Bem-vindo, ' + (data.user.nome || 'Usuário') + '! 🎉');
      console.log('✅ Login bem-sucedido:', data.user);
    } else {
      mostrarToast(data.error || 'Erro ao fazer login', 'error');
      console.log('❌ Erro no login:', data);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    mostrarToast('Erro de conexão com o servidor', 'error');
  }
}

// ============================================
// FUNÇÃO DE CADASTRO
// ============================================
async function cadastrar() {
  const nomeInput = document.getElementById('nome-cadastro');
  const emailInput = document.getElementById('email-cadastro');
  const telefoneInput = document.getElementById('telefone-cadastro');
  const regiaoInput = document.getElementById('regiao-cadastro');
  const senhaInput = document.getElementById('senha-cadastro');
  
  if (!nomeInput || !emailInput || !telefoneInput || !regiaoInput || !senhaInput) {
    mostrarToast('Erro: campos de cadastro não encontrados', 'error');
    return;
  }
  
  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const telefone = telefoneInput.value.trim();
  const regiao = regiaoInput.value.trim();
  const senha = senhaInput.value;
  
  console.log('📝 Tentando cadastro:', { nome, email, telefone, regiao });
  
  if (!nome || !email || !telefone || !regiao || !senha) {
    mostrarToast('Preencha todos os campos', 'error');
    return;
  }
  
  if (senha.length < 6) {
    mostrarToast('A senha deve ter pelo menos 6 caracteres', 'error');
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ nome, email, telefone, regiao, password: senha })
    });
    
    const data = await res.json();
    console.log('📝 Resposta cadastro:', data);
    
    if (res.ok) {
      mostrarToast('✅ Cadastro realizado com sucesso! Faça login.');
      fecharCadastro();
      abrirLogin();
      const emailLogin = document.getElementById('email-login');
      if (emailLogin) emailLogin.value = email;
      // ✅ REMOVA a chamada de notificação daqui - O BACKEND já envia!
    } else {
      mostrarToast(data.error || 'Erro ao cadastrar', 'error');
    }
  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    mostrarToast('Erro de conexão com o servidor', 'error');
  }
}
// ============================================
// FUNÇÃO DE LOGOUT
// ============================================
function logout() {
  localStorage.removeItem('userJM');
  localStorage.removeItem('tokenJM');
  localStorage.removeItem('carrinhoJM');
  usuarioLogado = null;
  tokenJM = null;
  carrinho = [];
  atualizarUIUsuario();
  atualizarContador();
  mostrarToast('Logout realizado com sucesso!');
}

// ============================================
// FUNÇÃO PARA ATUALIZAR UI
// ============================================
function atualizarUIUsuario() {
  console.log('🔄 Atualizando UI, usuarioLogado:', usuarioLogado);
  
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnPerfil = document.getElementById('btn-perfil');
  const btnAdmin = document.getElementById('btn-admin');
  const btnWishlist = document.getElementById('btn-wishlist');
  const userNome = document.getElementById('user-nome');
  
  if (usuarioLogado && tokenJM) {
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (btnPerfil) btnPerfil.style.display = 'inline-block';
    if (btnWishlist) btnWishlist.style.display = 'inline-block';
    if (userNome) userNome.textContent = '👋 ' + (usuarioLogado.nome || 'Usuário');
    
    if (btnAdmin) {
      if (usuarioLogado.is_admin) {
        btnAdmin.style.display = 'inline-block';
      } else {
        btnAdmin.style.display = 'none';
      }
    }
  } else {
    if (btnLogin) btnLogin.style.display = 'inline-block';
    if (btnLogout) btnLogout.style.display = 'none';
    if (btnPerfil) btnPerfil.style.display = 'none';
    if (btnAdmin) btnAdmin.style.display = 'none';
    if (btnWishlist) btnWishlist.style.display = 'none';
    if (userNome) userNome.textContent = '';
  }
}

// ============================================
// FUNÇÃO PARA CARREGAR CATEGORIAS
// ============================================
async function carregarCategorias() {
  try {
    console.log('🔄 Carregando categorias...');
    const res = await fetch(API_URL + '/api/categorias');
    if (!res.ok) throw new Error('Erro ao carregar categorias: ' + res.status);
    const categorias = await res.json();
    console.log('✅ Categorias carregadas:', categorias);
    
    const container = document.getElementById('filtros-categorias');
    
    if (!container) {
      console.error('❌ Elemento "filtros-categorias" não encontrado!');
      return;
    }
    
    container.innerHTML = '<button onclick="filtrar(\'todos\')" class="ativo">Todos</button>';
    categorias.forEach(function(cat) {
      container.innerHTML += '<button onclick="filtrar(\'' + cat + '\')">' + capitalizar(cat) + '</button>';
    });
  } catch (error) {
    console.error('❌ Erro carregar categorias:', error);
  }
}

// ============================================
// FUNÇÃO PARA CARREGAR PRODUTOS
// ============================================
async function carregarProdutos() {
  try {
    console.log('🔄 Carregando produtos...');
    const res = await fetch(API_URL + '/api/produtos');
    console.log('📡 Produtos Status:', res.status);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar produtos: ' + res.status);
    }
    
    todosProdutos = await res.json();
    console.log('✅ Produtos carregados:', todosProdutos.length);
    
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    renderizarProdutos();
  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = 
        '<p style="color:red; text-align:center;">⚠️ Erro ao carregar produtos. Tente novamente.</p>';
    }
  }
}

// ============================================
// FUNÇÃO PARA RENDERIZAR PRODUTOS
// ============================================
function renderizarProdutos() {
  const lista = document.getElementById('lista-produtos');
  
  if (!lista) {
    console.error('❌ Elemento "lista-produtos" não encontrado!');
    return;
  }
  
  const filtrados = categoriaAtiva === 'todos' 
    ? todosProdutos 
    : todosProdutos.filter(function(p) { return p.categoria === categoriaAtiva; });
  
  if (filtrados.length === 0) {
    lista.innerHTML = '<p style="text-align:center; padding:40px;">Nenhum produto encontrado</p>';
    return;
  }
  
  lista.innerHTML = filtrados.map(function(p) {
    const imagemFallback = 'https://via.placeholder.com/300x300/1E3A8A/FFFFFF?text=JM+Store';
    const imagemUrl = p.imagem || imagemFallback;
    
    const statusIcon = p.status === 'novo' ? '🆕' : '🔄' : '';
    const statusText = p.status === 'novo' ? 'Novo' : 'Recondicionado' : '';
    const estoqueIcon = p.estoque === 'disponivel' ? '✅' : '';
    const estoqueText = p.estoque === 'disponivel' ? 'Disponível' : 'SobEncomenda';
    
    return `
    <div class="produto" data-id="${p.id}">
      <img src="${imagemUrl}" alt="${p.nome}" loading="lazy" style="cursor:pointer;" 
           onerror="this.src='https://via.placeholder.com/300x300/1E3A8A/FFFFFF?text=JM+Store'"
           onclick='abrirDetalhes(${JSON.stringify(p)})'>
      <div class="produto-info">
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:5px;">
          <span class="tag">${capitalizar(p.categoria)}</span>
          <span class="tag" style="background:${p.status === 'novo' ? '#D1FAE5' : '#FEF3C7'}; color:${p.status === 'novo' ? '#065F46' : '#92400E'};">
            ${statusIcon} ${statusText}
          </span>
          <span class="tag" style="background:${p.estoque === 'disponivel' ? '#D1FAE5' : '#FEE2E2'}; color:${p.estoque === 'disponivel' ? '#065F46' : '#991B1B'};">
            ${estoqueIcon} ${estoqueText}
          </span>
        </div>
        <h3 style="font-size: 1.1em; margin: 5px 0;">${p.nome}</h3>
        <p class="preco" style="font-size: 20px;">${p.preco.toLocaleString('pt-PT')} KZ</p>
        
        <div style="font-size: 13px; color: #666; margin: 5px 0; border-top: 1px solid #eee; padding-top: 8px;">
          <div style="display:flex; justify-content:space-between;">
            <span>🚚 Luanda:</span>
            <span><strong>${(p.frete_luanda || 0).toLocaleString('pt-PT')} KZ</strong></span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>🚚 Outras Províncias:</span>
            <span><strong>${(p.frete_outras || 5000).toLocaleString('pt-PT')} KZ</strong></span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size: 12px; color: #888;">
            <span>⏱️ Entrega:</span>
            <span>${p.tempo_entrega || '1-2 dias úteis'}</span>
          </div>
        </div>
        
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn" onclick='adicionarCarrinho(${JSON.stringify(p)})' 
                  style="${p.estoque === 'indisponivel' ? 'background:#9CA3AF'}"
                  ${p.estoque === 'indisponivel' ? 'disabled'}>
            ${p.estoque === 'disponivel' ? '🛒 Adicionar' : ' Reservar'}
          </button>
          <button class="btn" style="background:transparent; border:1px solid #ddd; flex:0; padding:12px 15px; width:auto; font-size:20px;" 
                  onclick='toggleWishlist(${p.id})' id="wishlist-btn-${p.id}">
            🤍
          </button>
          <button class="btn" style="background:#6366F1; flex:0; padding:12px 15px; width:auto;" 
                  onclick='abrirDetalhes(${JSON.stringify(p)})'>
            📋
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');
  
  if (usuarioLogado && tokenJM) {
    carregarWishlistStatus();
  }
}

// ============================================
// FUNÇÃO DE FILTRO
// ============================================
function filtrar(cat) {
  categoriaAtiva = cat;
  document.querySelectorAll('.filtros button').forEach(function(btn) {
    btn.classList.toggle('ativo', btn.textContent.toLowerCase() === cat || 
      (cat === 'todos' && btn.textContent === 'Todos'));
  });
  renderizarProdutos();
}

// ============================================
// FUNÇÃO AUXILIAR
// ============================================
function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ============================================
// FUNÇÃO PARA ABRIR DETALHES DO PRODUTO
// ============================================
function abrirDetalhes(produto) {
  const modalExistente = document.getElementById('modal-detalhes');
  if (modalExistente) modalExistente.remove();
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modal-detalhes';
  modal.style.display = 'block';
  
  const especs = produto.especificacoes || {};
  
  let especHtml = '';
  for (var key in especs) {
    if (especs.hasOwnProperty(key)) {
      especHtml += `
        <tr>
          <td style="padding:8px; font-weight:bold; text-transform:capitalize;">${key}:</td>
          <td style="padding:8px;">${especs[key]}</td>
        </tr>
      `;
    }
  }
  
  modal.innerHTML = `
    <div class="modal-conteudo" style="max-width:700px; max-height:90vh; overflow-y:auto;">
      <span class="fechar" onclick="fecharDetalhes()">&times;</span>
      <h2>${produto.nome}</h2>
      
      <div style="display:flex; gap:20px; flex-wrap:wrap; margin:20px 0;">
        <img src="${produto.imagem || 'https://via.placeholder.com/200x200/1E3A8A/FFFFFF?text=JM'}" alt="${produto.nome}" style="max-width:200px; border-radius:8px; object-fit:cover;"
             onerror="this.src='https://via.placeholder.com/200x200/1E3A8A/FFFFFF?text=JM'">
        <div style="flex:1;">
          <p><strong>Preço:</strong> ${produto.preco.toLocaleString('pt-PT')} KZ</p>
          <p><strong>Status:</strong> ${produto.status === 'novo' ? '🆕 Novo' : '🔄 Recondicionado'}</p>
          <p><strong>Estoque:</strong> ${produto.estoque === 'disponivel' ? '✅ Disponível' : '❌ Indisponível'}</p>
          <p><strong>Entrega:</strong> ${produto.tempo_entrega || '1-2 dias úteis'}</p>
          <p><strong>Frete Luanda:</strong> ${(produto.frete_luanda || 0).toLocaleString('pt-PT')} KZ</p>
          <p><strong>Frete Outras Províncias:</strong> ${(produto.frete_outras || 5000).toLocaleString('pt-PT')} KZ</p>
        </div>
      </div>
      
      ${especHtml ? `
        <div style="border-top:1px solid #ddd; padding-top:15px;">
          <h3>📋 Especificações</h3>
          <table style="width:100%; margin-top:10px; border-collapse:collapse;">
            ${especHtml}
          </table>
        </div>
      ` : ''}
      
      <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" onclick='adicionarCarrinho(${JSON.stringify(produto)})' style="flex:1;">🛒 Adicionar ao Carrinho</button>
        <button class="btn" style="background:#25D366; flex:1;" onclick="window.open('https://wa.me/244949321312?text=Olá! Quero comprar ${encodeURIComponent(produto.nome)}', '_blank')">📱 Comprar Agora</button>
      </div>
      
      <div style="margin-top:20px; border-top:1px solid #ddd; padding-top:15px;">
        <h3>⭐ Avaliações</h3>
        <div id="avaliacoes-container-detalhes">
          <p style="color:#666;">Carregando avaliações...</p>
        </div>
        ${usuarioLogado ? `
          <div style="margin-top:10px;">
            <button class="btn" style="background:#6366F1;" onclick="abrirModalAvaliacao(${produto.id})">+ Avaliar Produto</button>
          </div>
        ` : `
          <p style="color:#666; font-size:14px;">Faça login para avaliar este produto</p>
        `}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  carregarAvaliacoes(produto.id, 'avaliacoes-container-detalhes');
}

function fecharDetalhes() {
  const modal = document.getElementById('modal-detalhes');
  if (modal) modal.remove();
}

// ============================================
// FUNÇÃO PARA CARREGAR AVALIAÇÕES
// ============================================
async function carregarAvaliacoes(produtoId, containerId) {
  try {
    const res = await fetch(API_URL + '/api/avaliacoes/' + produtoId);
    const avaliacoes = await res.json();
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (avaliacoes.length === 0) {
      container.innerHTML = '<p style="color:#666;">Seja o primeiro a avaliar este produto! ⭐</p>';
      return;
    }
    
    container.innerHTML = avaliacoes.map(function(a) {
      return `
        <div style="border:1px solid #eee; border-radius:8px; padding:15px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${a.usuarios ? a.usuarios.nome : 'Anônimo'}</strong>
              <span style="margin-left:10px;">${'⭐'.repeat(a.nota)}</span>
            </div>
            <span style="font-size:12px; color:#999;">${new Date(a.data_criacao).toLocaleDateString('pt-PT')}</span>
          </div>
          ${a.titulo ? '<h4 style="margin:5px 0;">' + a.titulo + '</h4>' : ''}
          <p style="color:#555;">${a.comentario || ''}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
  }
}

// ============================================
// FUNÇÃO PARA CARREGAR FAQ
// ============================================
async function carregarFAQ() {
  try {
    console.log('🔄 Carregando FAQ...');
    const res = await fetch(API_URL + '/api/faq');
    console.log('📡 FAQ Status:', res.status);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar FAQ: ' + res.status);
    }
    
    const faqs = await res.json();
    console.log('✅ FAQ carregadas:', faqs);
    renderizarFAQ(faqs);
  } catch (error) {
    console.error('❌ Erro ao carregar FAQ:', error);
    const container = document.getElementById('faq-container');
    if (container) {
      container.innerHTML = `
        <p style="color:#666; text-align:center; padding:20px;">
          ⚠️ Erro ao carregar perguntas. 
          <br><small>Tente recarregar a página.</small>
        </p>
      `;
    }
  }
}

// ============================================
// FUNÇÃO PARA RENDERIZAR FAQ
// ============================================
function renderizarFAQ(faqs) {
  const container = document.getElementById('faq-container');
  if (!container) {
    console.error('❌ Elemento "faq-container" não encontrado!');
    return;
  }
  
  console.log('📝 Renderizando FAQ, quantidade:', faqs ? faqs.length : 0);
  
  if (!faqs || faqs.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#666;">Nenhuma pergunta frequente cadastrada.</p>';
    return;
  }
  
  container.innerHTML = faqs.map(function(f) {
    return `
      <div style="border:1px solid #eee; border-radius:8px; margin-bottom:10px; overflow:hidden;">
        <div style="padding:15px; cursor:pointer; background:#f8fafc; display:flex; justify-content:space-between; align-items:center;" 
             onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">
          <strong>${f.pergunta}</strong>
          <span>▼</span>
        </div>
        <div style="padding:15px; display:none; border-top:1px solid #eee; white-space:pre-line; background:white;">
          ${f.resposta}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// FUNÇÕES DE CARRINHO
// ============================================
function atualizarContador() {
  const total = carrinho.reduce(function(s, i) { return s + (i.quantidade || 0); }, 0);
  const counter = document.getElementById('carrinho-count');
  if (counter) counter.textContent = total;
}

function adicionarCarrinho(produto) {
  const item = carrinho.find(function(i) { return i.id === produto.id; });
  if (item) {
    item.quantidade++;
  } else {
    carrinho.push({ ...produto, quantidade: 1 });
  }
  
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  atualizarContador();
  mostrarToast(produto.nome + ' adicionado ao carrinho! 🛒');
}

function abrirCarrinho() {
  const modal = document.getElementById('modal-carrinho');
  if (modal) {
    modal.style.display = 'block';
    renderizarCarrinho();
    registrarCheckout();
  } else {
    mostrarToast('Erro: carrinho não encontrado', 'error');
  }
}

function fecharCarrinho() {
  const modal = document.getElementById('modal-carrinho');
  if (modal) modal.style.display = 'none';
}

function renderizarCarrinho() {
  const container = document.getElementById('carrinhoItens');
  const totalSpan = document.getElementById('totalCarrinho');
  
  if (!container || !totalSpan) {
    console.error('❌ Elementos do carrinho não encontrados');
    return;
  }
  
  if (carrinho.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:30px;">🛒 Carrinho vazio</p>';
    totalSpan.textContent = '0';
    return;
  }
  
  container.innerHTML = carrinho.map(function(item) {
    return `
      <div class="item-carrinho">
        <img src="${item.imagem || 'https://via.placeholder.com/50x50/1E3A8A/FFFFFF?text=JM'}" alt="${item.nome}">
        <div class="item-info">
          <p><b>${item.nome}</b></p>
          <p style="font-size:14px; color:#666;">
            ${item.preco.toLocaleString('pt-PT')} KZ x ${item.quantidade}
          </p>
        </div>
        <div style="display:flex; gap:5px; align-items:center;">
          <button onclick="alterarQuantidade(${item.id}, -1)" style="background:#E5E7EB; border:none; width:25px; height:25px; border-radius:50%; cursor:pointer;">-</button>
          <span style="min-width:20px; text-align:center;">${item.quantidade}</span>
          <button onclick="alterarQuantidade(${item.id}, 1)" style="background:#E5E7EB; border:none; width:25px; height:25px; border-radius:50%; cursor:pointer;">+</button>
          <button onclick="removerDoCarrinho(${item.id})" style="background:#DC2626; color:white; border:none; width:25px; height:25px; border-radius:50%; cursor:pointer; margin-left:5px;">✕</button>
        </div>
      </div>
    `;
  }).join('');
  
  const total = carrinho.reduce(function(s, i) { return s + i.preco * i.quantidade; }, 0);
  totalSpan.textContent = total.toLocaleString('pt-PT');
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(function(i) { return i.id === id; });
  if (!item) return;
  
  item.quantidade += delta;
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter(function(i) { return i.id !== id; });
  }
  
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  renderizarCarrinho();
  atualizarContador();
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(function(i) { return i.id !== id; });
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  renderizarCarrinho();
  atualizarContador();
}

// ============================================
// FUNÇÃO PARA FINALIZAR PEDIDO
// ============================================
async function finalizar() {
  if (!usuarioLogado) {
    mostrarToast('Faça login para finalizar', 'error');
    return abrirLogin();
  }
  
  if (carrinho.length === 0) {
    mostrarToast('Carrinho vazio', 'error');
    return;
  }
  
  const endereco = document.getElementById('endereco-entrega');
  const metodo = document.getElementById('metodo-pagamento');
  
  const enderecoValue = endereco ? endereco.value.trim() : '';
  const metodoValue = metodo ? metodo.value : 'WhatsApp';
  
  const btn = document.querySelector('#modal-carrinho .btn-whatsapp');
  const textoOriginal = btn ? btn.textContent : 'Finalizar';
  if (btn) {
    btn.textContent = '⏳ Processando...';
    btn.disabled = true;
  }
  
  try {
    const res = await fetch(API_URL + '/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenJM
      },
      body: JSON.stringify({
        itens: carrinho,
        endereco: enderecoValue,
        metodo_pagamento: metodoValue,
        sessionId: sessionId
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      carrinho = [];
      localStorage.removeItem('carrinhoJM');
      atualizarContador();
      fecharCarrinho();
      
      mostrarToast('✅ Pedido enviado! Redirecionando para WhatsApp...');
      // ✅ REMOVA a chamada de notificação daqui - O BACKEND já envia!
      setTimeout(function() {
        window.location.href = data.link;
      }, 2000);
    } else {
      mostrarToast(data.error || 'Erro ao finalizar', 'error');
    }
  } catch (error) {
    console.error('Erro ao finalizar:', error);
    mostrarToast('Erro de conexão', 'error');
  } finally {
    if (btn) {
      btn.textContent = textoOriginal;
      btn.disabled = false;
    }
  }
}

// ============================================
// WISHLIST
// ============================================
async function toggleWishlist(produtoId) {
  if (!usuarioLogado) {
    mostrarToast('Faça login para salvar na wishlist', 'error');
    return abrirLogin();
  }
  
  try {
    const btn = document.getElementById('wishlist-btn-' + produtoId);
    if (!btn) return;
    
    // Verificar se já está na wishlist
    const resCheck = await fetch(API_URL + '/api/wishlist', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    const wishlist = await resCheck.json();
    const existe = wishlist.some(function(item) { return item.produto_id === produtoId; });
    
    if (existe) {
      const res = await fetch(API_URL + '/api/wishlist/' + produtoId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + tokenJM }
      });
      if (res.ok) {
        btn.textContent = '🤍';
        mostrarToast('Removido da wishlist ❤️');
      }
    } else {
      const res = await fetch(API_URL + '/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenJM
        },
        body: JSON.stringify({ produto_id: produtoId })
      });
      if (res.ok) {
        btn.textContent = '❤️';
        mostrarToast('Adicionado à wishlist ❤️');
      }
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  }
}

async function carregarWishlistStatus() {
  try {
    const res = await fetch(API_URL + '/api/wishlist', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    const wishlist = await res.json();
    
    wishlist.forEach(function(item) {
      const btn = document.getElementById('wishlist-btn-' + item.produto_id);
      if (btn) btn.textContent = '❤️';
    });
  } catch (error) {
    console.error('Erro carregar wishlist status:', error);
  }
}

async function abrirWishlist() {
  if (!usuarioLogado) {
    mostrarToast('Faça login para ver sua wishlist', 'error');
    return abrirLogin();
  }
  
  try {
    const res = await fetch(API_URL + '/api/wishlist', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    const wishlist = await res.json();
    
    const container = document.getElementById('wishlist-itens');
    
    if (wishlist.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Sua wishlist está vazia 💔</p>';
    } else {
      container.innerHTML = wishlist.map(function(item) {
        const p = item.produtos;
        return `
          <div style="display:flex; align-items:center; gap:15px; padding:10px; border-bottom:1px solid #eee;">
            <img src="${p.imagem}" alt="${p.nome}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">
            <div style="flex:1;">
              <strong>${p.nome}</strong>
              <p style="color:#16A34A; font-weight:bold;">${p.preco.toLocaleString('pt-PT')} KZ</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm" style="background:#22C55E; width:auto;" onclick='adicionarCarrinho(${JSON.stringify(p)})'>🛒</button>
              <button class="btn btn-sm btn-danger" style="width:auto;" onclick='toggleWishlist(${p.id})'>🗑️</button>
            </div>
          </div>
        `;
      }).join('');
    }
    
    document.getElementById('modal-wishlist').style.display = 'block';
  } catch (error) {
    mostrarToast('Erro ao carregar wishlist', 'error');
  }
}

function fecharWishlist() {
  document.getElementById('modal-wishlist').style.display = 'none';
}

// ============================================
// FUNÇÕES DE PERFIL
// ============================================
async function abrirPerfil() {
  if (!usuarioLogado) {
    mostrarToast('Faça login para ver seu perfil', 'error');
    return abrirLogin();
  }
  
  try {
    const res = await fetch(API_URL + '/api/usuario/perfil', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    
    if (!res.ok) {
      throw new Error('Erro ao carregar perfil');
    }
    
    const data = await res.json();
    
    const nomeEl = document.getElementById('perfil-nome');
    const emailEl = document.getElementById('perfil-email');
    const telefoneEl = document.getElementById('perfil-telefone');
    const regiaoEl = document.getElementById('perfil-regiao');
    const dataEl = document.getElementById('perfil-data');
    
    if (nomeEl) nomeEl.textContent = data.nome || 'Não informado';
    if (emailEl) emailEl.textContent = data.email || 'Não informado';
    if (telefoneEl) telefoneEl.textContent = data.telefone || 'Não informado';
    if (regiaoEl) regiaoEl.textContent = data.regiao || 'Não informado';
    if (dataEl) dataEl.textContent = data.data_cadastro ? new Date(data.data_cadastro).toLocaleDateString('pt-PT') : 'Não informado';
    
    const modal = document.getElementById('modal-perfil');
    if (modal) {
      modal.style.display = 'block';
      const pedidosContainer = document.getElementById('perfil-pedidos');
      if (pedidosContainer) pedidosContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    mostrarToast('Erro ao carregar perfil', 'error');
  }
}

function fecharPerfil() {
  const modal = document.getElementById('modal-perfil');
  if (modal) modal.style.display = 'none';
}

function abrirEditarPerfil() {
  const nome = document.getElementById('perfil-nome');
  const telefone = document.getElementById('perfil-telefone');
  const regiao = document.getElementById('perfil-regiao');
  
  const editNome = document.getElementById('editar-nome');
  const editTelefone = document.getElementById('editar-telefone');
  const editRegiao = document.getElementById('editar-regiao');
  
  if (editNome) editNome.value = nome ? nome.textContent : '';
  if (editTelefone) editTelefone.value = telefone ? telefone.textContent : '';
  if (editRegiao) editRegiao.value = (regiao && regiao.textContent !== 'Não informado') ? regiao.textContent : '';
  
  const modal = document.getElementById('modal-editar-perfil');
  if (modal) modal.style.display = 'block';
}

function fecharEditarPerfil() {
  const modal = document.getElementById('modal-editar-perfil');
  if (modal) modal.style.display = 'none';
}

async function salvarPerfil() {
  const nome = document.getElementById('editar-nome');
  const telefone = document.getElementById('editar-telefone');
  const regiao = document.getElementById('editar-regiao');
  
  const nomeValue = nome ? nome.value.trim() : '';
  const telefoneValue = telefone ? telefone.value.trim() : '';
  const regiaoValue = regiao ? regiao.value.trim() : '';
  
  if (!nomeValue) {
    mostrarToast('Nome é obrigatório', 'error');
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/usuario/perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenJM
      },
      body: JSON.stringify({ 
        nome: nomeValue, 
        telefone: telefoneValue, 
        regiao: regiaoValue 
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      usuarioLogado = { ...usuarioLogado, nome: nomeValue, telefone: telefoneValue, regiao: regiaoValue };
      localStorage.setItem('userJM', JSON.stringify(usuarioLogado));
      atualizarUIUsuario();
      fecharEditarPerfil();
      abrirPerfil();
      mostrarToast('Perfil atualizado com sucesso! ✅');
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao atualizar perfil', 'error');
    }
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// PEDIDOS
// ============================================
async function verPedidos() {
  const container = document.getElementById('perfil-pedidos');
  
  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/pedidos', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    const pedidos = await res.json();
    
    if (pedidos.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:#666;">Nenhum pedido ainda</p>';
    } else {
      container.innerHTML = pedidos.map(function(p) {
        return `
          <div style="border:1px solid #ddd; border-radius:8px; padding:15px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
              <strong>#${p.id}</strong>
              <span style="padding:3px 10px; border-radius:12px; font-size:12px; 
                ${p.status === 'Pendente' ? 'background:#FEF3C7; color:#92400E;' : 
                  p.status === 'Enviado' ? 'background:#D1FAE5; color:#065F46;' : 
                  'background:#E5E7EB; color:#374151;'}">
                ${p.status}
              </span>
            </div>
            <p style="font-size:14px; color:#666;">
              ${new Date(p.data_pedido).toLocaleDateString('pt-PT')} - 
              ${p.itens_pedido ? p.itens_pedido.length : 0} itens
            </p>
            <p style="font-weight:bold; color:#16A34A;">
              ${p.total.toLocaleString('pt-PT')} KZ
            </p>
            ${p.codigo_rastreio ? `<p style="font-size:13px; color:#3B82F6;">📦 Código: ${p.codigo_rastreio}</p>` : ''}
            <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
              <button class="btn btn-sm" style="background:#6366F1; width:auto;" onclick='verRastreio(${p.id})'>📦 Rastrear</button>
              <details style="flex:1;">
                <summary style="cursor:pointer; color:#1E3A8A; font-size:14px;">Ver detalhes</summary>
                ${p.itens_pedido ? p.itens_pedido.map(function(item) {
                  return `
                    <div style="display:flex; gap:10px; padding:5px 0; border-bottom:1px solid #f0f0f0; font-size:14px;">
                      <span>${item.produtos ? item.produtos.nome : 'Produto'}</span>
                      <span>x${item.quantidade}</span>
                      <span style="margin-left:auto;">${(item.preco_unitario * item.quantidade).toLocaleString('pt-PT')} KZ</span>
                    </div>
                  `;
                }).join('') : ''}
              </details>
            </div>
          </div>
        `;
      }).join('');
    }
    
    container.style.display = 'block';
  } catch (error) {
    alert('Erro ao carregar pedidos');
  }
}

// ============================================
// RASTREIO
// ============================================
async function verRastreio(pedidoId) {
  try {
    const res = await fetch(API_URL + '/api/pedidos/' + pedidoId + '/rastreio', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    
    if (res.ok) {
      const data = await res.json();
      document.getElementById('rastreio-conteudo').innerHTML = `
        <p><strong>Código:</strong> ${data.codigo_rastreio || 'Aguardando'}</p>
        <p><strong>Transportadora:</strong> ${data.transportadora || 'JM Express'}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <div style="margin-top:15px;">
          <h4>Histórico:</h4>
          ${data.historico_rastreio && data.historico_rastreio.length > 0 ? 
            data.historico_rastreio.map(function(h) {
              return `
                <div style="border-left:2px solid #1E3A8A; padding-left:10px; margin:10px 0;">
                  <p><strong>${h.status}</strong></p>
                  <p style="font-size:13px; color:#666;">${h.observacao || ''}</p>
                  <p style="font-size:12px; color:#999;">${new Date(h.data).toLocaleString('pt-PT')}</p>
                </div>
              `;
            }).join('') 
            : '<p style="color:#666;">Nenhum histórico disponível</p>'
          }
        </div>
      `;
      document.getElementById('modal-rastreio').style.display = 'block';
    }
  } catch (error) {
    mostrarToast('Erro ao carregar rastreio', 'error');
  }
}

function fecharRastreio() {
  document.getElementById('modal-rastreio').style.display = 'none';
}


// ============================================
// FUNÇÕES DE AVALIAÇÃO
// ============================================
function abrirModalAvaliacao(produtoId) {
  produtoAtualAvaliacao = produtoId;
  const modal = document.getElementById('modal-avaliacao');
  if (modal) {
    modal.style.display = 'block';
    const titulo = document.getElementById('avaliacao-titulo');
    const comentario = document.getElementById('avaliacao-comentario');
    const nota = document.getElementById('avaliacao-nota');
    if (titulo) titulo.value = '';
    if (comentario) comentario.value = '';
    if (nota) nota.value = '5';
  }
}

function fecharModalAvaliacao() {
  const modal = document.getElementById('modal-avaliacao');
  if (modal) modal.style.display = 'none';
  produtoAtualAvaliacao = null;
}

async function enviarAvaliacao() {
  if (!produtoAtualAvaliacao) {
    mostrarToast('Erro: produto não identificado', 'error');
    return;
  }
  
  const nota = document.getElementById('avaliacao-nota');
  const titulo = document.getElementById('avaliacao-titulo');
  const comentario = document.getElementById('avaliacao-comentario');
  
  const notaValue = nota ? nota.value : '5';
  const tituloValue = titulo ? titulo.value.trim() : '';
  const comentarioValue = comentario ? comentario.value.trim() : '';
  
  try {
    const res = await fetch(API_URL + '/api/avaliacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenJM
      },
      body: JSON.stringify({ 
        produto_id: produtoAtualAvaliacao, 
        nota: Number(notaValue), 
        titulo: tituloValue, 
        comentario: comentarioValue 
      })
    });
    
    if (res.ok) {
      mostrarToast('Avaliação enviada com sucesso! ⭐');
      fecharModalAvaliacao();
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao enviar avaliação', 'error');
    }
  } catch (error) {
    console.error('Erro ao enviar avaliação:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// FUNÇÕES DE NEWSLETTER E VISITANTES
// ============================================
async function inscricaoNewsletter() {
  const email = document.getElementById('newsletter-email');
  const nome = document.getElementById('newsletter-nome');
  
  const emailValue = email ? email.value.trim() : '';
  const nomeValue = nome ? nome.value.trim() : '';
  
  if (!emailValue) {
    mostrarToast('Digite seu email!', 'error');
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, nome: nomeValue })
    });
    
    if (res.ok) {
      mostrarToast('✅ Inscrito com sucesso!');
      if (email) email.value = '';
      if (nome) nome.value = '';
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro na inscrição', 'error');
    }
  } catch (error) {
    console.error('Erro na newsletter:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

async function carregarCarrinhoServidor() {
  try {
    const res = await fetch(API_URL + '/api/carrinho', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    
    if (res.ok) {
      const itens = await res.json();
      carrinho = itens.map(function(item) {
        return { ...item, preco: Number(item.preco) };
      });
      localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
      atualizarContador();
    }
  } catch (error) {
    console.error('Erro carregar carrinho:', error);
  }
}

async function registrarCheckout() {
  try {
    const dadosUsuario = usuarioLogado ? {
      nome: usuarioLogado.nome,
      email: usuarioLogado.email,
      telefone: usuarioLogado.telefone || 'Não informado',
      regiao: usuarioLogado.regiao || 'Não informado'
    } : {
      nome: 'Visitante',
      email: 'Não informado',
      telefone: 'Não informado',
      regiao: 'Não informado'
    };
    
    await fetch(API_URL + '/api/checkout/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        usuario: dadosUsuario,
        itens: carrinho
      })
    });
  } catch (error) {
    console.error('Erro registrar checkout:', error);
  }
}

async function registrarVisita() {
  try {
    // Obter localização primeiro
    let localizacao = null;
    try {
      const locRes = await fetch(API_URL + '/api/geolocalizacao');
      if (locRes.ok) {
        localizacao = await locRes.json();
      }
    } catch (e) {
      console.warn('Erro ao obter localização:', e);
    }
    
    const resposta = await fetch(API_URL + '/api/visitantes/registrar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        sessionId: sessionId, 
        pagina: window.location.pathname,
        userAgent: navigator.userAgent,
        localizacao: localizacao // Adiciona a localização!
      })
    });
    
    const data = await resposta.json();
    console.log('📊 Visita registrada:', data);
  } catch (error) {
    console.warn('Erro ao registrar visita (não crítico):', error);
  }
}



// ============================================
// HEADER QUE ENCOLHE AO SCROLL
// ============================================

let ultimoScroll = 0;
const header = document.querySelector('header');
const SCROLL_LIMITE = 80; // Quantos pixels rolar para encolher

window.addEventListener('scroll', function() {
  const scrollAtual = window.pageYOffset || document.documentElement.scrollTop;
  
  // Se rolou mais que o limite, encolhe
  if (scrollAtual > SCROLL_LIMITE) {
    header.classList.add('shrink');
  } else {
    header.classList.remove('shrink');
  }
  
  ultimoScroll = scrollAtual;
});

// Executar ao carregar para verificar estado inicial
document.addEventListener('DOMContentLoaded', function() {
  if (window.pageYOffset > SCROLL_LIMITE) {
    header.classList.add('shrink');
  }
});


// ============================================
// FECHAR MODAIS CLICANDO FORA
// ============================================
document.querySelectorAll('.modal').forEach(function(modal) {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

console.log('🚀 JM Store carregada com sucesso!');
console.log('👤 Usuário:', usuarioLogado);
console.log('📡 API_URL:', API_URL);

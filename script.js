// ============================================
// CONFIGURAÇÕES INICIAIS
// ============================================
const API_URL = 'https://jm-server.onrender.com';

console.log('📡 API_URL:', API_URL);

// ============================================
// FUNÇÕES DE TESTE (DEBUG)
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
// CHAMAR TESTE NA INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  // Testar conexão
  const conectado = await testarConexao();
  if (!conectado) {
    mostrarToast('⚠️ Erro de conexão com o servidor. Tente novamente.', 'error');
    document.getElementById('loading').innerHTML = 
      '<p style="color:red; text-align:center;">⚠️ Servidor indisponível. Tente novamente mais tarde.</p>';
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
  document.getElementById('link-cadastro').addEventListener('click', function(e) {
    e.preventDefault();
    fecharLogin();
    abrirCadastro();
  });
  
  document.getElementById('link-login').addEventListener('click', function(e) {
    e.preventDefault();
    fecharCadastro();
    abrirLogin();
  });
  
  document.getElementById('senha-login').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') login();
  });
  
  document.getElementById('senha-cadastro').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') cadastrar();
  });
});

// ============================================
// FUNÇÃO PARA LOGIN CORRIGIDA
// ============================================
async function login() {
  const email = document.getElementById('email-login').value.trim();
  const senha = document.getElementById('senha-login').value;
  
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
    
    // Tentar ler a resposta mesmo se não for JSON
    const text = await res.text();
    console.log('📝 Resposta bruta:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Resposta não é JSON:', text);
      mostrarToast('Erro no servidor. Tente novamente.', 'error');
      return;
    }
    
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
// FUNÇÃO PARA FAQ CORRIGIDA
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
// FUNÇÃO PARA PRODUTOS CORRIGIDA
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
    renderizarProdutos();
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    document.getElementById('loading').innerHTML = 
      '<p style="color:red; text-align:center;">⚠️ Erro ao carregar produtos. Tente novamente.</p>';
  }
}

// ============================================
// FUNÇÃO PARA CATEGORIAS CORRIGIDA
// ============================================
async function carregarCategorias() {
  try {
    console.log('🔄 Carregando categorias...');
    const res = await fetch(API_URL + '/api/categorias');
    if (!res.ok) throw new Error('Erro ao carregar categorias');
    const categorias = await res.json();
    console.log('✅ Categorias carregadas:', categorias);
    
    const container = document.getElementById('filtros-categorias');
    container.innerHTML = '<button onclick="filtrar(\'todos\')" class="ativo">Todos</button>';
    categorias.forEach(function(cat) {
      container.innerHTML += '<button onclick="filtrar(\'' + cat + '\')">' + capitalizar(cat) + '</button>';
    });
  } catch (error) {
    console.error('❌ Erro carregar categorias:', error);
  }
}

// ============================================
// WISHLIST CORRIGIDA
// ============================================
async function toggleWishlist(produtoId) {
  if (!usuarioLogado) {
    mostrarToast('Faça login para salvar na wishlist', 'error');
    return abrirLogin();
  }
  
  try {
    console.log('🔄 Toggle wishlist:', produtoId);
    const btn = document.getElementById('wishlist-btn-' + produtoId);
    if (!btn) return;
    
    const resCheck = await fetch(API_URL + '/api/wishlist', {
      headers: { 
        'Authorization': 'Bearer ' + tokenJM,
        'Content-Type': 'application/json'
      }
    });
    
    if (!resCheck.ok) {
      console.error('❌ Erro ao buscar wishlist:', resCheck.status);
      mostrarToast('Erro ao verificar wishlist', 'error');
      return;
    }
    
    const wishlist = await resCheck.json();
    const existe = wishlist.some(function(item) { return item.produto_id === produtoId; });
    
    if (existe) {
      const res = await fetch(API_URL + '/api/wishlist/' + produtoId, {
        method: 'DELETE',
        headers: { 
          'Authorization': 'Bearer ' + tokenJM,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        btn.textContent = '🤍';
        mostrarToast('Removido da wishlist 💔');
      } else {
        console.error('❌ Erro ao remover:', await res.text());
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
      } else {
        console.error('❌ Erro ao adicionar:', await res.text());
      }
    }
  } catch (error) {
    console.error('❌ Erro ao alternar wishlist:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// FUNÇÃO DE REGISTRO CORRIGIDA
// ============================================
async function cadastrar() {
  const nome = document.getElementById('nome-cadastro').value.trim();
  const email = document.getElementById('email-cadastro').value.trim();
  const telefone = document.getElementById('telefone-cadastro').value.trim();
  const regiao = document.getElementById('regiao-cadastro').value.trim();
  const senha = document.getElementById('senha-cadastro').value;
  
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
      document.getElementById('email-login').value = email;
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
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    btnPerfil.style.display = 'inline-block';
    btnWishlist.style.display = 'inline-block';
    userNome.textContent = '👋 ' + (usuarioLogado.nome || 'Usuário');
    
    if (usuarioLogado.is_admin) {
      btnAdmin.style.display = 'inline-block';
    } else {
      btnAdmin.style.display = 'none';
    }
  } else {
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    btnPerfil.style.display = 'none';
    btnAdmin.style.display = 'none';
    btnWishlist.style.display = 'none';
    userNome.textContent = '';
  }
}

// ============================================
// RENDERIZAR FAQ CORRIGIDA
// ============================================
function renderizarFAQ(faqs) {
  const container = document.getElementById('faq-container');
  if (!container) return;
  
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
// FUNÇÕES DE MODAIS
// ============================================
function abrirLogin() {
  document.getElementById('modal-login').style.display = 'block';
}

function fecharLogin() {
  document.getElementById('modal-login').style.display = 'none';
}

function abrirCadastro() {
  document.getElementById('modal-cadastro').style.display = 'block';
}

function fecharCadastro() {
  document.getElementById('modal-cadastro').style.display = 'none';
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ============================================
// FUNÇÕES DE CARRINHO (simplificadas)
// ============================================
let carrinho = [];
let usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
let tokenJM = localStorage.getItem('tokenJM');
let todosProdutos = [];
let categoriaAtiva = 'todos';
let sessionId = localStorage.getItem('sessionId') || `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

localStorage.setItem('sessionId', sessionId);

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

// ============================================
// FUNÇÕES DE PRODUTOS (renderização)
// ============================================
function renderizarProdutos() {
  const lista = document.getElementById('lista-produtos');
  const filtrados = categoriaAtiva === 'todos' 
    ? todosProdutos 
    : todosProdutos.filter(function(p) { return p.categoria === categoriaAtiva; });
  
  if (filtrados.length === 0) {
    lista.innerHTML = '<p style="text-align:center; padding:40px;">Nenhum produto encontrado</p>';
    return;
  }
  
  lista.innerHTML = filtrados.map(function(p) {
    const statusIcon = p.status === 'novo' ? '🆕' : '🔄';
    const statusText = p.status === 'novo' ? 'Novo' : 'Recondicionado';
    const estoqueIcon = p.estoque === 'disponivel' ? '✅' : '❌';
    const estoqueText = p.estoque === 'disponivel' ? 'Disponível' : 'Indisponível';
    
    return `
    <div class="produto" data-id="${p.id}">
      <img src="${p.imagem}" alt="${p.nome}" loading="lazy" style="cursor:pointer;" onclick='abrirDetalhes(${JSON.stringify(p)})'>
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
                  style="${p.estoque === 'indisponivel' ? 'background:#9CA3AF; cursor:not-allowed; flex:2;' : 'flex:2;'}"
                  ${p.estoque === 'indisponivel' ? 'disabled' : ''}>
            ${p.estoque === 'disponivel' ? '🛒 Adicionar' : '❌ Indisponível'}
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
}

function filtrar(cat) {
  categoriaAtiva = cat;
  document.querySelectorAll('.filtros button').forEach(function(btn) {
    btn.classList.toggle('ativo', btn.textContent.toLowerCase() === cat || 
      (cat === 'todos' && btn.textContent === 'Todos'));
  });
  renderizarProdutos();
}

// ============================================
// FUNÇÕES DE DETALHES
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
        <img src="${produto.imagem}" alt="${produto.nome}" style="max-width:200px; border-radius:8px; object-fit:cover;">
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
    </div>
  `;
  
  document.body.appendChild(modal);
}

function fecharDetalhes() {
  const modal = document.getElementById('modal-detalhes');
  if (modal) modal.remove();
}

// ============================================
// FUNÇÕES DE WISHLIST E AVALIAÇÃO (Simplificadas)
// ============================================
async function carregarWishlistStatus() {
  // Implementação simplificada
}

function abrirWishlist() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

function fecharWishlist() {
  // placeholder
}

function abrirModalAvaliacao(produtoId) {
  mostrarToast('Função em desenvolvimento', 'warning');
}

function fecharModalAvaliacao() {
  // placeholder
}

async function enviarAvaliacao() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

async function verRastreio(pedidoId) {
  mostrarToast('Função em desenvolvimento', 'warning');
}

function fecharRastreio() {
  // placeholder
}

async function verPedidos() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

function abrirEditarPerfil() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

function fecharEditarPerfil() {
  // placeholder
}

async function salvarPerfil() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

async function abrirPerfil() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

function fecharPerfil() {
  // placeholder
}

async function carregarCarrinhoServidor() {
  // Implementação simplificada
}

async function finalizar() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

async function registrarVisita() {
  // Implementação simplificada
}

async function inscricaoNewsletter() {
  mostrarToast('Função em desenvolvimento', 'warning');
}

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

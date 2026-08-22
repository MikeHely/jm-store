// ============================================
// CONFIGURAÇÕES
// ============================================
const API_URL = 'https://jm-server.onrender.com';

const usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
const token = localStorage.getItem('tokenJM');

console.log('📡 API_URL:', API_URL);
console.log('👑 Admin:', usuarioLogado);

if (!usuarioLogado || !token || !usuarioLogado.is_admin) {
  alert('Acesso restrito. Faça login como administrador.');
  window.location.href = 'index.html';
}

let filtroAdmin = 'todos';
let todosProdutos = [];
let registrosData = [];

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('📊 Carregando admin...');
  
  await carregarDashboard();
  await carregarTabela();
  await carregarAbandonos();
  await carregarMarketingStats();
  await carregarVisitantes();
  
  const form = document.getElementById('form-produto');
  if (form) {
    form.addEventListener('submit', salvarProduto);
  }
  
  const uploadInput = document.getElementById('upload-imagem');
  if (uploadInput) {
    uploadInput.addEventListener('change', fazerUpload);
  }
  
  const imagemInput = document.getElementById('imagem');
  if (imagemInput) {
    imagemInput.addEventListener('input', function(e) {
      const url = e.target.value.trim();
      const container = document.getElementById('preview-container');
      const img = document.getElementById('preview-imagem');
      
      if (url && url.startsWith('http')) {
        if (img) img.src = url;
        if (container) container.style.display = 'block';
      } else {
        if (container) container.style.display = 'none';
      }
    });
  }
  
  console.log('✅ Admin carregado com sucesso!');
});

// ============================================
// TOAST
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
// DASHBOARD
// ============================================
async function carregarDashboard() {
  try {
    const res = await fetch(API_URL + '/api/admin/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    
    const statProdutos = document.getElementById('stat-produtos');
    const statPedidos = document.getElementById('stat-pedidos');
    const statUsuarios = document.getElementById('stat-usuarios');
    
    if (statProdutos) statProdutos.textContent = data.stats ? data.stats.totalProdutos : 0;
    if (statPedidos) statPedidos.textContent = data.stats ? data.stats.totalPedidos : 0;
    if (statUsuarios) statUsuarios.textContent = data.stats ? data.stats.totalUsuarios : 0;
  } catch (error) {
    console.error('Erro dashboard:', error);
  }
}

// ============================================
// VISITANTES
// ============================================
async function carregarVisitantes() {
  try {
    const res = await fetch(API_URL + '/api/admin/visitantes', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    
    const totalEl = document.getElementById('stat-visitas-total');
    const hojeEl = document.getElementById('stat-visitas-hoje');
    const unicosEl = document.getElementById('stat-visitas-unicos');
    const container = document.getElementById('ultimas-visitas');
    
    if (totalEl) totalEl.textContent = data.total || 0;
    if (hojeEl) hojeEl.textContent = data.hoje || 0;
    if (unicosEl) unicosEl.textContent = data.unicos || 0;
    
    if (container) {
      if (data.ultimas && data.ultimas.length > 0) {
        container.innerHTML = data.ultimas.map(function(v) {
          return `
            <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee; font-size:13px;">
              <span>${v.pagina || '/'}</span>
              <span style="color:#666;">${new Date(v.data_visita).toLocaleString('pt-PT')}</span>
              <span style="color:#999; font-size:11px;">${v.user_agent ? v.user_agent.substring(0, 30) + '...' : 'Desconhecido'}</span>
            </div>
          `;
        }).join('');
      } else {
        container.innerHTML = '<p style="color:#666; font-size:14px;">Nenhuma visita registrada ainda.</p>';
      }
    }
  } catch (error) {
    console.error('Erro ao carregar visitantes:', error);
  }
}

// ============================================
// MARKETING
// ============================================
async function carregarMarketingStats() {
  try {
    const res = await fetch(API_URL + '/api/admin/contatos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const contatos = await res.json();
    
    const total = contatos.length;
    const newsletter = contatos.filter(function(c) { return c.origem === 'newsletter'; }).length;
    const abandonos = contatos.filter(function(c) { return c.origem === 'abandono'; }).length;
    const vip = contatos.filter(function(c) { return c.total_compras >= 5 || c.total_gasto >= 500000; }).length;
    
    const totalClientes = document.getElementById('stat-total-clientes');
    const statNewsletter = document.getElementById('stat-newsletter');
    const statAbandonos = document.getElementById('stat-abandonos-marketing');
    const statVip = document.getElementById('stat-vip');
    
    if (totalClientes) totalClientes.textContent = total;
    if (statNewsletter) statNewsletter.textContent = newsletter;
    if (statAbandonos) statAbandonos.textContent = abandonos;
    if (statVip) statVip.textContent = vip;
  } catch (error) {
    console.error('Erro carregar stats marketing:', error);
  }
}

async function exportarContatos() {
  try {
    const res = await fetch(API_URL + '/api/admin/contatos/exportar', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contatos_marketing.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    mostrarToast('📥 Contatos exportados com sucesso!');
  } catch (error) {
    mostrarToast('Erro ao exportar', 'error');
  }
}

function abrirModalCampanha() {
  const modal = document.getElementById('modal-campanha');
  if (modal) modal.style.display = 'block';
}

function fecharModalCampanha() {
  const modal = document.getElementById('modal-campanha');
  if (modal) modal.style.display = 'none';
}

async function salvarCampanha(enviarAgora) {
  const listaId = document.getElementById('campanha-lista');
  const titulo = document.getElementById('campanha-titulo');
  const tipo = document.getElementById('campanha-tipo');
  const mensagem = document.getElementById('campanha-mensagem');
  
  const listaIdValue = listaId ? listaId.value : '1';
  const tituloValue = titulo ? titulo.value.trim() : '';
  const tipoValue = tipo ? tipo.value : 'email';
  const mensagemValue = mensagem ? mensagem.value.trim() : '';
  
  if (!tituloValue || !mensagemValue) {
    mostrarToast('Preencha título e mensagem!', 'error');
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/admin/campanhas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        lista_id: Number(listaIdValue),
        titulo: tituloValue,
        mensagem: mensagemValue,
        tipo: tipoValue,
        enviar_agora: enviarAgora
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      mostrarToast(enviarAgora ? '📨 Campanha enviada!' : '💾 Campanha salva!');
      fecharModalCampanha();
      if (titulo) titulo.value = '';
      if (mensagem) mensagem.value = '';
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao criar campanha', 'error');
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// RASTREIO
// ============================================
async function atualizarRastreio() {
  const pedidoId = document.getElementById('rastreio-pedido-id');
  const codigo = document.getElementById('rastreio-codigo');
  const status = document.getElementById('rastreio-status');
  const observacao = document.getElementById('rastreio-observacao');
  
  const pedidoIdValue = pedidoId ? pedidoId.value.trim() : '';
  const codigoValue = codigo ? codigo.value.trim() : '';
  const statusValue = status ? status.value : 'Pendente';
  const observacaoValue = observacao ? observacao.value.trim() : '';
  
  if (!pedidoIdValue) {
    mostrarToast('Digite o ID do pedido!', 'error');
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/admin/pedidos/' + pedidoIdValue + '/rastreio', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        codigo_rastreio: codigoValue || null,
        transportadora: 'JM Express',
        status: statusValue,
        observacao: observacaoValue || ''
      })
    });
    
    if (res.ok) {
      mostrarToast('✅ Rastreio atualizado com sucesso!');
      if (pedidoId) pedidoId.value = '';
      if (codigo) codigo.value = '';
      if (observacao) observacao.value = '';
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao atualizar rastreio', 'error');
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// ABANDONOS
// ============================================
async function carregarAbandonos() {
  try {
    const res = await fetch(API_URL + '/api/admin/abandonos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    registrosData = data;
    
    const statAbandonos = document.getElementById('stat-abandonos');
    const statFinalizados = document.getElementById('stat-finalizados');
    
    if (statAbandonos) statAbandonos.textContent = data.total_abandonos || 0;
    if (statFinalizados) statFinalizados.textContent = data.total_finalizados || 0;
    
    renderizarAbandonos();
  } catch (error) {
    console.error('Erro carregar abandonos:', error);
  }
}

function renderizarAbandonos() {
  const container = document.getElementById('abandonos-lista');
  if (!container) return;
  
  const abandonados = registrosData.abandonos || [];
  const finalizados = registrosData.finalizados || [];
  
  if (abandonados.length === 0 && finalizados.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">🎉 Nenhum registro ainda</p>';
    return;
  }
  
  let html = '';
  
  // FINALIZADOS
  if (finalizados.length > 0) {
    html += '<h4 style="color:#065F46; margin:15px 0 10px;">✅ FINALIZADOS (' + finalizados.length + ')</h4>';
    html += finalizados.map(function(a) {
      return `
        <div class="registro-item" style="border:1px solid #D1FAE5; border-radius:8px; padding:15px; margin-bottom:10px; background:#F0FDF4;">
          <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:10px;">
            <div>
              <strong>✅ ${a.usuario && a.usuario.nome ? a.usuario.nome : 'Visitante'}</strong>
              <span style="font-size:14px; color:#666; display:block;">
                📧 ${a.usuario && a.usuario.email ? a.usuario.email : 'Não informado'} | 📱 ${a.usuario && a.usuario.telefone ? a.usuario.telefone : 'Não informado'}
              </span>
              <span style="font-size:12px; color:#999;">
                🕐 ${new Date(a.timestamp).toLocaleString('pt-PT')}
                ${a.data_finalizacao ? '| ✅ Finalizou: ' + new Date(a.data_finalizacao).toLocaleString('pt-PT') : ''}
              </span>
              ${a.pedido_id ? '<span style="display:block; font-size:12px; color:#3B82F6;">📋 Pedido #' + a.pedido_id + '</span>' : ''}
            </div>
            <div style="text-align:right;">
              <span style="font-weight:bold; color:#16A34A;">
                💰 ${(a.total || 0).toLocaleString('pt-PT')} KZ
              </span>
              <span style="display:block; font-size:12px; color:#666;">
                📦 ${a.itens ? a.itens.length : 0} itens
              </span>
              <span style="display:inline-block; padding:2px 10px; background:#D1FAE5; color:#065F46; border-radius:12px; font-size:12px; font-weight:bold;">
                ✅ Finalizado
              </span>
            </div>
          </div>
          
          <details style="margin-top:10px;">
            <summary style="cursor:pointer; color:#1E3A8A; font-size:14px;">Ver itens</summary>
            ${a.itens && a.itens.length > 0 ? a.itens.map(function(item) {
              return `
                <div style="display:flex; gap:10px; padding:5px 0; border-bottom:1px solid #f0f0f0; font-size:14px;">
                  <span>${item.nome}</span>
                  <span>x${item.quantidade}</span>
                  <span style="margin-left:auto;">${(item.preco * item.quantidade).toLocaleString('pt-PT')} KZ</span>
                </div>
              `;
            }).join('') : '<p style="color:#999;">Sem itens</p>'}
          </details>
          
          <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
            <button onclick="notificarWhatsApp('${a.sessionId}')" class="btn btn-success btn-sm">
              📱 WhatsApp
            </button>
            <button onclick="excluirRegistro('${a.sessionId}')" class="btn btn-danger btn-sm">
              🗑️ Excluir
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // ABANDONADOS
  if (abandonados.length > 0) {
    html += '<h4 style="color:#92400E; margin:15px 0 10px;">🛒 ABANDONADOS (' + abandonados.length + ')</h4>';
    html += abandonados.map(function(a) {
      return `
        <div class="registro-item" style="border:1px solid #FED7AA; border-radius:8px; padding:15px; margin-bottom:10px; background:#FFF7ED;">
          <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:10px;">
            <div>
              <strong>🛒 ${a.usuario && a.usuario.nome ? a.usuario.nome : 'Visitante'}</strong>
              <span style="font-size:14px; color:#666; display:block;">
                📧 ${a.usuario && a.usuario.email ? a.usuario.email : 'Não informado'} | 📱 ${a.usuario && a.usuario.telefone ? a.usuario.telefone : 'Não informado'}
              </span>
              <span style="font-size:12px; color:#999;">
                🕐 ${new Date(a.timestamp).toLocaleString('pt-PT')}
                ${a.tentativas > 0 ? '| 📨 ' + a.tentativas + ' tentativas' : ''}
              </span>
            </div>
            <div style="text-align:right;">
              <span style="font-weight:bold; color:#92400E;">
                💰 ${(a.total || 0).toLocaleString('pt-PT')} KZ
              </span>
              <span style="display:block; font-size:12px; color:#666;">
                📦 ${a.itens ? a.itens.length : 0} itens
              </span>
              <span style="display:inline-block; padding:2px 10px; background:#FEF3C7; color:#92400E; border-radius:12px; font-size:12px; font-weight:bold;">
                🛒 Abandonado
              </span>
            </div>
          </div>
          
          <details style="margin-top:10px;">
            <summary style="cursor:pointer; color:#1E3A8A; font-size:14px;">Ver itens</summary>
            ${a.itens && a.itens.length > 0 ? a.itens.map(function(item) {
              return `
                <div style="display:flex; gap:10px; padding:5px 0; border-bottom:1px solid #f0f0f0; font-size:14px;">
                  <span>${item.nome}</span>
                  <span>x${item.quantidade}</span>
                  <span style="margin-left:auto;">${(item.preco * item.quantidade).toLocaleString('pt-PT')} KZ</span>
                </div>
              `;
            }).join('') : '<p style="color:#999;">Sem itens</p>'}
          </details>
          
          <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
            <button onclick="notificarWhatsApp('${a.sessionId}')" class="btn btn-success btn-sm">
              📱 WhatsApp
            </button>
            <button onclick="excluirRegistro('${a.sessionId}')" class="btn btn-danger btn-sm">
              🗑️ Excluir
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  container.innerHTML = html;
}

// ============================================
// NOTIFICAÇÕES WHATSAPP
// ============================================
async function notificarWhatsApp(sessionId) {
  try {
    const res = await fetch(API_URL + '/api/admin/notificar-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ sessionId: sessionId })
    });
    
    const data = await res.json();
    
    if (data.success) {
      mostrarToast('📱 Abrindo WhatsApp...', 'success');
      setTimeout(function() { window.open(data.link, '_blank'); }, 500);
      await carregarAbandonos();
    } else {
      mostrarToast(data.error || 'Erro ao notificar', 'error');
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// EXCLUIR REGISTRO
// ============================================
function excluirRegistro(sessionId) {
  if (confirm('Tem certeza que deseja excluir este registro?')) {
    confirmarExcluirRegistro(sessionId);
  }
}

async function confirmarExcluirRegistro(sessionId) {
  try {
    const res = await fetch(API_URL + '/api/admin/abandonos/' + sessionId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.ok) {
      mostrarToast('Registro excluído com sucesso!');
      await carregarAbandonos();
    } else {
      mostrarToast('Erro ao excluir registro', 'error');
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// LIMPAR REGISTROS
// ============================================
function limparRegistros(tipo) {
  const mensagens = {
    'todos': 'Deseja limpar TODOS os registros?',
    'abandonados': 'Deseja limpar apenas os ABANDONADOS?',
    'finalizados': 'Deseja limpar apenas os FINALIZADOS?'
  };
  
  if (confirm(mensagens[tipo] || 'Deseja limpar os registros?')) {
    confirmarLimparRegistros(tipo);
  }
}

async function confirmarLimparRegistros(tipo) {
  try {
    const res = await fetch(API_URL + '/api/admin/abandonos/limpar', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ tipo: tipo })
    });
    
    if (res.ok) {
      mostrarToast('Registros limpos com sucesso!');
      await carregarAbandonos();
      await carregarDashboard();
    } else {
      mostrarToast('Erro ao limpar registros', 'error');
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  }
}

function atualizarLista() {
  carregarAbandonos();
  mostrarToast('Lista atualizada!', 'success');
}

// ============================================
// MODAL CONFIRMAÇÃO
// ============================================
let acaoConfirmada = null;

function mostrarConfirmacao(titulo, mensagem, callback) {
  let modal = document.getElementById('modal-confirmacao');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-confirmacao';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-conteudo" style="max-width:400px;">
        <h3 id="confirmacao-titulo">Tem certeza?</h3>
        <p id="confirmacao-mensagem" style="margin:15px 0;">Esta ação não pode ser desfeita.</p>
        <div style="display:flex; gap:10px; margin-top:20px;">
          <button onclick="confirmarAcao(true)" class="btn" style="background:#DC2626; flex:1;">Confirmar</button>
          <button onclick="confirmarAcao(false)" class="btn" style="background:#666; flex:1;">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById('confirmacao-titulo').textContent = titulo;
  document.getElementById('confirmacao-mensagem').textContent = mensagem;
  modal.style.display = 'block';
  acaoConfirmada = callback;
}

function confirmarAcao(confirmado) {
  const modal = document.getElementById('modal-confirmacao');
  modal.style.display = 'none';
  if (confirmado && acaoConfirmada) {
    acaoConfirmada();
    acaoConfirmada = null;
  }
}

// ============================================
// TABELA PRODUTOS
// ============================================
async function carregarTabela() {
  try {
    const res = await fetch(API_URL + '/api/admin/produtos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Erro ao carregar');
    todosProdutos = await res.json();
    renderizarTabela();
  } catch (error) {
    console.error('Erro:', error);
    mostrarToast('Erro ao carregar produtos', 'error');
  }
}

function renderizarTabela() {
  let produtos = todosProdutos;
  
  if (filtroAdmin === 'visiveis') {
    produtos = produtos.filter(function(p) { return p.visivel !== false; });
  } else if (filtroAdmin === 'ocultos') {
    produtos = produtos.filter(function(p) { return p.visivel === false; });
  }
  
  const tbody = document.getElementById('tabela-body');
  if (!tbody) return;
  
  if (produtos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Nenhum produto encontrado</td></tr>';
    return;
  }
  
  tbody.innerHTML = produtos.map(function(p) {
    return `
      <tr style="${!p.visivel ? 'opacity:0.5; background:#F1F5F9;' : ''}">
        <td><img src="${p.imagem || 'https://via.placeholder.com/50x50/1E3A8A/FFFFFF?text=JM'}" alt="${p.nome}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;"
             onerror="this.src='https://via.placeholder.com/50x50/1E3A8A/FFFFFF?text=JM'"></td>
        <td>
          ${p.nome}
          ${!p.visivel ? '🔒' : ''}
          <br>
          <small style="color:#666;">
            ${p.status === 'novo' ? '🆕 Novo' : '🔄 Recondicionado'} | 
            ${p.estoque === 'disponivel' ? '✅ Disponível' : '❌ Indisponível'}
          </small>
        </td>
        <td>
          ${p.preco.toLocaleString('pt-AO')} KZ
          <br>
          <small style="color:#666;">
            🚚 ${(p.frete_luanda || 0).toLocaleString('pt-AO')} KZ
          </small>
        </td>
        <td>
          <span class="tag">${p.categoria}</span>
          <br>
          <small style="color:#666;">⏱️ ${p.tempo_entrega || 'N/A'}</small>
        </td>
        <td class="acoes">
          <button class="btn btn-edit btn-sm" onclick='editar(${JSON.stringify(p)})'>Editar</button>
          <button class="btn ${p.visivel ? 'btn-warning' : 'btn-success'} btn-sm" onclick='alternarVisibilidade(${p.id}, ${!p.visivel})'>
            ${p.visivel ? '🙈 Ocultar' : '👁️ Mostrar'}
          </button>
          <button class="btn btn-danger btn-sm" onclick='confirmarExcluirProduto(${p.id}, "${p.nome}")'>Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filtrarAdmin(filtro) {
  filtroAdmin = filtro;
  document.querySelectorAll('.filtros-admin button').forEach(function(btn) {
    btn.classList.toggle('ativo', btn.textContent.includes(
      filtro === 'todos' ? 'Todos' : filtro === 'visiveis' ? 'Visíveis' : 'Ocultos'
    ));
  });
  renderizarTabela();
}

// ============================================
// CRUD PRODUTOS
// ============================================
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

async function salvarProduto(e) {
  e.preventDefault();
  
  const id = document.getElementById('produto-id').value;
  
  // Coletar especificações
  const especificacoes = {};
  const campos = ['cor', 'memoria', 'tamanho', 'origem', 'material', 'peso', 'bateria', 'processador'];
  campos.forEach(function(campo) {
    const el = document.getElementById('esp-' + campo);
    if (el && el.value.trim()) {
      especificacoes[campo] = el.value.trim();
    }
  });
  
  // Coletar imagens extras
  const imagensExtras = coletarImagens();
  
  const produto = {
    nome: document.getElementById('nome').value.trim(),
    preco: Number(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value,
    status: document.getElementById('status').value,
    estoque: document.getElementById('estoque').value,
    frete_luanda: Number(document.getElementById('frete_luanda').value) || 0,
    frete_outras: Number(document.getElementById('frete_outras').value) || 5000,
    tempo_entrega: document.getElementById('tempo_entrega').value.trim() || '1-2 dias úteis',
    imagem: document.getElementById('imagem').value.trim(),
    especificacoes: especificacoes
  };

  // Validação
  if (!produto.nome || produto.nome.length < 2) {
    mostrarToast('Nome do produto é obrigatório', 'error');
    return;
  }
  if (!produto.preco || produto.preco <= 0) {
    mostrarToast('Preço inválido', 'error');
    return;
  }
  if (!produto.imagem || !produto.imagem.startsWith('http')) {
    mostrarToast('URL da imagem inválida', 'error');
    return;
  }

  const btn = document.querySelector('.form-produto .btn');
  const textoOriginal = btn ? btn.textContent : 'Salvar';
  if (btn) {
    btn.textContent = '⏳ Salvando...';
    btn.disabled = true;
  }

  try {
    let url = API_URL + '/api/admin/produtos';
    let method = 'POST';
    if (id) {
      url = API_URL + '/api/admin/produtos/' + id;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method: method,
      headers: authHeaders(),
      body: JSON.stringify(produto)
    });

    if (res.ok) {
      const data = await res.json();
      const produtoId = data.id || id;
      
      if (imagensExtras.length > 0) {
        await fetch(API_URL + '/api/admin/imagens', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            produto_id: produtoId,
            urls: imagensExtras
          })
        });
      }
      
      mostrarToast(id ? 'Produto atualizado!' : 'Produto criado!');
      document.getElementById('form-produto').reset();
      document.getElementById('produto-id').value = '';
      document.getElementById('preview-container').style.display = 'none';
      document.getElementById('imagens-container').innerHTML = '';
      await carregarTabela();
      await carregarDashboard();
    } else if (res.status === 401 || res.status === 403) {
      mostrarToast('Sessão expirada. Faça login novamente.', 'error');
      setTimeout(logout, 1500);
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao salvar', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarToast('Erro de conexão', 'error');
  } finally {
    if (btn) {
      btn.textContent = textoOriginal;
      btn.disabled = false;
    }
  }
}

function editar(produto) {
  document.getElementById('produto-id').value = produto.id;
  document.getElementById('nome').value = produto.nome;
  document.getElementById('preco').value = produto.preco;
  document.getElementById('categoria').value = produto.categoria;
  document.getElementById('status').value = produto.status || 'novo';
  document.getElementById('estoque').value = produto.estoque || 'disponivel';
  document.getElementById('frete_luanda').value = produto.frete_luanda || 0;
  document.getElementById('frete_outras').value = produto.frete_outras || 5000;
  document.getElementById('tempo_entrega').value = produto.tempo_entrega || '1-2 dias úteis';
  document.getElementById('imagem').value = produto.imagem;
  
  const esp = produto.especificacoes || {};
  const campos = ['cor', 'memoria', 'tamanho', 'origem', 'material', 'peso', 'bateria', 'processador'];
  campos.forEach(function(campo) {
    const el = document.getElementById('esp-' + campo);
    if (el) el.value = esp[campo] || '';
  });
  
  const preview = document.getElementById('preview-imagem');
  if (preview) {
    preview.src = produto.imagem;
    const container = document.getElementById('preview-container');
    if (container) container.style.display = 'block';
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function abrirModalNovo() {
  document.getElementById('form-produto').reset();
  document.getElementById('produto-id').value = '';
  const previewContainer = document.getElementById('preview-container');
  if (previewContainer) previewContainer.style.display = 'none';
  const imagensContainer = document.getElementById('imagens-container');
  if (imagensContainer) imagensContainer.innerHTML = '';
  
  const campos = ['cor', 'memoria', 'tamanho', 'origem', 'material', 'peso', 'bateria', 'processador'];
  campos.forEach(function(campo) {
    const el = document.getElementById('esp-' + campo);
    if (el) el.value = '';
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function alternarVisibilidade(id, novoEstado) {
  try {
    const res = await fetch(API_URL + '/api/admin/produtos/' + id + '/visibilidade', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ visivel: novoEstado })
    });
    
    if (res.ok) {
      mostrarToast('Produto ' + (novoEstado ? 'visível' : 'oculto') + '!');
      await carregarTabela();
      await carregarDashboard();
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao alterar visibilidade', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

function confirmarExcluirProduto(id, nome) {
  mostrarConfirmacao(
    'Excluir Produto',
    'Tem certeza que deseja excluir "' + nome + '"? Esta ação não pode ser desfeita.',
    function() { deletarProduto(id); }
  );
}

async function deletarProduto(id) {
  try {
    const res = await fetch(API_URL + '/api/admin/produtos/' + id, {
      method: 'DELETE',
      headers: authHeaders()
    });
    
    if (res.ok) {
      mostrarToast('Produto excluído!');
      await carregarTabela();
      await carregarDashboard();
    } else if (res.status === 401 || res.status === 403) {
      mostrarToast('Sessão expirada. Faça login novamente.', 'error');
      setTimeout(logout, 1500);
    } else {
      const data = await res.json();
      mostrarToast(data.error || 'Erro ao excluir', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

// ============================================
// UPLOAD DE IMAGENS - CORRIGIDO
// ============================================

async function fazerUpload(e) {
  const file = e.target.files[0];
  if (!file) {
    mostrarToast('Nenhum arquivo selecionado', 'error');
    return;
  }

  // Validações
  if (!file.type.startsWith('image/')) {
    mostrarToast('Por favor, selecione uma imagem válida (JPG, PNG, WebP, GIF)', 'error');
    e.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    mostrarToast('A imagem é muito grande. Máximo 5MB.', 'error');
    e.target.value = '';
    return;
  }

  const status = document.getElementById('upload-status');
  const previewContainer = document.getElementById('preview-container');
  const previewImg = document.getElementById('preview-imagem');
  const imagemInput = document.getElementById('imagem');

  if (!status) {
    console.error('Elemento upload-status não encontrado');
    return;
  }

  // Mostra progresso
  status.textContent = '⏳ Enviando...';
  status.style.color = '#F59E0B';

  try {
    const formData = new FormData();
    formData.append('imagem', file);

    const res = await fetch(API_URL + '/api/admin/upload', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      },
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMsg;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error || 'Erro no upload';
      } catch {
        errorMsg = 'Erro no upload: ' + res.status;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();

    if (data.success && data.url) {
      // Preenche o campo de imagem
      if (imagemInput) {
        imagemInput.value = data.url;
        // Dispara evento para atualizar preview
        imagemInput.dispatchEvent(new Event('input'));
      }

      // Mostra preview
      if (previewContainer && previewImg) {
        previewImg.src = data.url;
        previewContainer.style.display = 'block';
        previewImg.onerror = function() {
          // Se a imagem não carregar, usa fallback
          this.src = 'https://via.placeholder.com/150x150/1E3A8A/FFFFFF?text=JM';
        };
      }

      status.textContent = '✅ Imagem enviada com sucesso!';
      status.style.color = '#16A34A';
      mostrarToast('📸 Imagem enviada com sucesso!', 'success');
    } else {
      throw new Error(data.error || 'Resposta inválida do servidor');
    }

  } catch (error) {
    console.error('Erro no upload:', error);
    status.textContent = '❌ ' + (error.message || 'Erro ao enviar imagem');
    status.style.color = '#DC2626';
    mostrarToast('Erro ao enviar imagem: ' + error.message, 'error');
  } finally {
    // Limpa o input para permitir re-upload
    e.target.value = '';
  }
}

// ============================================
// REMOVER PREVIEW
// ============================================
function removerPreview() {
  const container = document.getElementById('preview-container');
  const imagemInput = document.getElementById('imagem');
  
  if (container) {
    container.style.display = 'none';
  }
  if (imagemInput) {
    imagemInput.value = '';
  }
  
  const previewImg = document.getElementById('preview-imagem');
  if (previewImg) {
    previewImg.src = '';
  }
}

// ============================================
// ADICIONAR INPUT DE IMAGEM EXTRA
// ============================================
function adicionarInputImagem() {
  const container = document.getElementById('imagens-container');
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'imagem-input';
  div.style.cssText = 'display:flex; gap:10px; margin-bottom:10px; align-items:center;';
  div.innerHTML = `
    <input type="text" placeholder="URL da imagem extra (opcional)" 
           style="flex:1; padding:8px; border:2px solid #E2E8F0; border-radius:8px; font-size:14px;">
    <button onclick="this.parentElement.remove()" 
            style="background:#DC2626; color:white; border:none; border-radius:5px; padding:8px 12px; cursor:pointer; font-size:16px;">
      ✕
    </button>
  `;
  container.appendChild(div);
}

function removerInputImagem(btn) {
  if (btn && btn.parentElement) {
    btn.parentElement.remove();
  }
}

function coletarImagens() {
  const inputs = document.querySelectorAll('#imagens-container input[type="text"]');
  const urls = [];
  inputs.forEach(function(input) {
    const val = input.value.trim();
    if (val && val.startsWith('http')) {
      urls.push(val);
    }
  });
  return urls;
}

// ============================================
// LOGOUT
// ============================================
function logout() {
  localStorage.removeItem('userJM');
  localStorage.removeItem('tokenJM');
  window.location.href = 'index.html';
}

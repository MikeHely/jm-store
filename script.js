// ============================================
// FUNÇÃO PARA ABRIR CARRINHO
// ============================================
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

// ============================================
// FUNÇÃO PARA RENDERIZAR CARRINHO
// ============================================
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

// ============================================
// FUNÇÕES PARA ALTERAR QUANTIDADE NO CARRINHO
// ============================================
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
// FUNÇÃO PARA REGISTRAR CHECKOUT (ABANDONO)
// ============================================
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
// FUNÇÕES DE PERFIL (COMPLETAS)
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
// FUNÇÕES DE PEDIDOS
// ============================================
async function verPedidos() {
  const container = document.getElementById('perfil-pedidos');
  if (!container) return;
  
  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }
  
  try {
    const res = await fetch(API_URL + '/api/pedidos', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    
    if (!res.ok) {
      throw new Error('Erro ao carregar pedidos');
    }
    
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
            <details>
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
        `;
      }).join('');
    }
    
    container.style.display = 'block';
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    mostrarToast('Erro ao carregar pedidos', 'error');
  }
}

// ============================================
// FUNÇÃO DE WISHLIST (COMPLETA)
// ============================================
function abrirWishlist() {
  if (!usuarioLogado) {
    mostrarToast('Faça login para ver sua wishlist', 'error');
    return abrirLogin();
  }
  
  // Implementação simplificada - carrega a wishlist
  carregarWishlistStatus();
  mostrarToast('❤️ Wishlist carregada!', 'success');
}

function fecharWishlist() {
  const modal = document.getElementById('modal-wishlist');
  if (modal) modal.style.display = 'none';
}

// ============================================
// FUNÇÃO DE RASTREIO
// ============================================
async function verRastreio(pedidoId) {
  try {
    const res = await fetch(API_URL + '/api/pedidos/' + pedidoId + '/rastreio', {
      headers: { 'Authorization': 'Bearer ' + tokenJM }
    });
    
    if (res.ok) {
      const data = await res.json();
      const container = document.getElementById('rastreio-conteudo');
      if (container) {
        container.innerHTML = `
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
      }
      const modal = document.getElementById('modal-rastreio');
      if (modal) modal.style.display = 'block';
    } else {
      mostrarToast('Erro ao carregar rastreio', 'error');
    }
  } catch (error) {
    console.error('Erro ao ver rastreio:', error);
    mostrarToast('Erro de conexão', 'error');
  }
}

function fecharRastreio() {
  const modal = document.getElementById('modal-rastreio');
  if (modal) modal.style.display = 'none';
}

// ============================================
// FUNÇÃO DE AVALIAÇÃO
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
// FUNÇÃO DE NEWSLETTER
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

// ============================================
// FUNÇÃO PARA CARREGAR CARRINHO DO SERVIDOR
// ============================================
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

console.log('🚀 JM Store carregada com sucesso!');
console.log('👤 Usuário:', usuarioLogado);
console.log('📡 API_URL:', API_URL);
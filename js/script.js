/* EventPlanner — convidados, checklist, orçamento e cronograma de cada evento */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const banco = {
  ler(k, padrao) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } },
  salvar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
};
const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const iso = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const dataBR = (s, op = { day: '2-digit', month: '2-digit' }) => (s ? new Date(s + 'T12:00').toLocaleDateString('pt-BR', op) : '');
const uid = () => Date.now() + Math.floor(Math.random() * 1000);

const TIPOS = { aniversario: ['🎂', 'Aniversário'], casamento: ['💍', 'Casamento'], corporativo: ['💼', 'Corporativo'], outro: ['🎉', 'Outro'] };
const CATS_ORC = ['Local', 'Buffet e bebidas', 'Decoração', 'Música', 'Foto e vídeo', 'Doces e bolo', 'Convites', 'Roupas', 'Lembrancinhas', 'Outros'];
const RSVP = { sim: ['Confirmado', '#2f855a'], talvez: ['Talvez', '#c19a4b'], pendente: ['Pendente', '#a0aec0'], nao: ['Não vai', '#c53030'] };
// checklist pronta: [tarefa, dias antes do evento]
const MODELOS = {
  aniversario: [['Definir lista de convidados', 45], ['Reservar o local', 40], ['Contratar buffet / salgados', 30], ['Encomendar o bolo', 20], ['Enviar convites', 21], ['Comprar decoração', 14], ['Montar playlist', 7], ['Confirmar presença dos convidados', 5], ['Comprar bebidas e gelo', 2], ['Separar velas e fósforo', 1]],
  casamento: [['Definir orçamento total', 365], ['Escolher e reservar o local', 300], ['Contratar fotógrafo', 270], ['Contratar buffet', 240], ['Escolher o vestido / traje', 180], ['Enviar save the date', 150], ['Contratar banda / DJ', 150], ['Enviar convites', 90], ['Prova do vestido', 30], ['Confirmar presenças', 20], ['Definir mapa de mesas', 14], ['Reunião final com fornecedores', 7]],
  corporativo: [['Definir objetivo e público', 60], ['Reservar espaço e equipamentos', 45], ['Convidar palestrantes', 40], ['Abrir inscrições', 30], ['Contratar coffee break', 21], ['Preparar materiais e crachás', 7], ['Testar som e projetor', 1]],
  outro: [['Definir data e local', 30], ['Fazer lista de convidados', 25], ['Enviar convites', 15], ['Comprar o necessário', 5], ['Confirmar presenças', 3]]
};

function exemplo() {
  const d = new Date(); d.setDate(d.getDate() + 24);
  const data = iso(d);
  const ev = { id: 1, nome: 'Aniversário de 30 anos da Marina', tipo: 'aniversario', data, hora: '19:00', local: 'Salão do condomínio', orcamento: 3500, convidados: [], tarefas: [], orc: [], cron: [] };
  const conv = [['Dona Rosa', 'Família', 0, 'sim'], ['Rafael Nunes', 'Amigos', 1, 'sim'], ['Juliana Prado', 'Amigos', 1, 'talvez'], ['Marcos e Bia', 'Amigos', 2, 'sim'], ['Carla Mendes', 'Trabalho', 0, 'pendente'], ['Diego Alves', 'Trabalho', 1, 'nao'], ['Tia Lúcia', 'Família', 2, 'sim'], ['Pedro Gomes', 'Amigos', 0, 'pendente'], ['Ana Souza', 'Trabalho', 1, 'pendente'], ['Vó Maria', 'Família', 0, 'sim']];
  ev.convidados = conv.map(([nome, grupo, acomp, rsvp]) => ({ id: uid() + Math.random(), nome, grupo, acomp, rsvp }));
  ev.tarefas = MODELOS.aniversario.map(([txt, antes], i) => { const p = new Date(d); p.setDate(p.getDate() - antes); return { id: i + 1, txt, prazo: iso(p), feita: antes > 24, resp: i % 3 === 0 ? 'Vinicius' : '' }; });
  ev.orc = [['Aluguel do salão', 'Local', 600, 600, true], ['Salgados e bebidas', 'Buffet e bebidas', 1500, 1380, false], ['Bolo de 3 kg', 'Doces e bolo', 280, 0, false], ['Balões e painel', 'Decoração', 350, 410, true], ['Lembrancinhas', 'Lembrancinhas', 200, 0, false]]
    .map(([item, cat, prev, real, pago], i) => ({ id: i + 1, item, cat, prev, real, pago }));
  ev.cron = [['18:00', 'Montagem da decoração', 'Equipe da decoração'], ['19:00', 'Chegada dos convidados', 'Recepção'], ['20:00', 'Jantar servido', 'Buffet'], ['21:30', 'Parabéns e bolo', 'Todos'], ['23:30', 'Encerramento', '']].map(([hora, txt, resp], i) => ({ id: i + 1, hora, txt, resp }));
  return { eventos: [ev], atual: 1 };
}
let dados = banco.ler('ep_dados', null) ?? exemplo();
const salvar = () => banco.salvar('ep_dados', dados);
const ev = () => dados.eventos.find((e) => e.id === dados.atual) || dados.eventos[0];
let aba = 'geral', filtroConv = 'todos';

/* ---------- Topo ---------- */
function diasPara(e) { return Math.ceil((new Date(`${e.data}T${e.hora || '12:00'}`) - Date.now()) / 864e5); }
function desenharTopo() {
  $('#evento-sel').innerHTML = dados.eventos.map((e) => `<option value="${e.id}" ${e.id === ev()?.id ? 'selected' : ''}>${TIPOS[e.tipo][0]} ${escapar(e.nome)}</option>`).join('');
  const e = ev();
  if (!e) { $('#hero').innerHTML = '<div><h1>Nenhum evento</h1><p>Crie seu primeiro evento no botão +.</p></div>'; return; }
  const alvo = new Date(`${e.data}T${e.hora || '00:00'}`), ms = alvo - Date.now();
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  $('#hero').innerHTML = `<div><h1>${escapar(e.nome)}</h1><p>${TIPOS[e.tipo][0]} ${dataBR(e.data, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${e.hora ? ` às ${e.hora}` : ''}${e.local ? ` · ${escapar(e.local)}` : ''}</p></div>
    ${ms > 0 ? `<div class="contagem" aria-label="Faltam ${d} dias"><div><b>${d}</b><small>dias</small></div><div><b>${h}</b><small>horas</small></div><div><b>${m}</b><small>min</small></div></div>` : `<div class="contagem"><div><b>${ms > -864e5 ? '🎉' : '✓'}</b><small>${ms > -864e5 ? 'É hoje!' : 'Já aconteceu'}</small></div></div>`}`;
}

/* ---------- Visão geral ---------- */
function resumoConv(e) {
  const c = { sim: 0, talvez: 0, pendente: 0, nao: 0 }, pessoas = { sim: 0, talvez: 0, pendente: 0, nao: 0 };
  e.convidados.forEach((x) => { c[x.rsvp]++; pessoas[x.rsvp] += 1 + (+x.acomp || 0); });
  return { c, pessoas, total: Object.values(pessoas).reduce((s, x) => s + x, 0) };
}
function resumoOrc(e) {
  const prev = e.orc.reduce((s, x) => s + (+x.prev || 0), 0), real = e.orc.reduce((s, x) => s + (+x.real || 0), 0);
  const comprometido = e.orc.reduce((s, x) => s + (+x.real || +x.prev || 0), 0); // usa o real quando já existe
  const pago = e.orc.filter((x) => x.pago).reduce((s, x) => s + (+x.real || +x.prev || 0), 0);
  return { prev, real, comprometido, pago };
}
const hojeISO = () => iso(new Date());
function desenharGeral() {
  const e = ev(); if (!e) { $('#v-geral').innerHTML = ''; return; }
  const rc = resumoConv(e), ro = resumoOrc(e);
  const feitas = e.tarefas.filter((t) => t.feita).length, pctT = e.tarefas.length ? Math.round((feitas / e.tarefas.length) * 100) : 0;
  const pend = e.tarefas.filter((t) => !t.feita).sort((a, b) => (a.prazo || '9').localeCompare(b.prazo || '9')).slice(0, 4);
  const orcTot = +e.orcamento || 0, sobra = orcTot - ro.comprometido;
  const barra = (partes, total) => `<div class="barrinha">${partes.map(([v, cor]) => `<i style="width:${total ? (v / total) * 100 : 0}%;background:${cor}"></i>`).join('')}</div>`;
  const proxCron = e.cron.length ? [...e.cron].sort((a, b) => a.hora.localeCompare(b.hora)) : [];
  $('#v-geral').innerHTML = `<div class="cards">
    <article class="card" data-ir="convidados"><h3>Convidados <small>${e.convidados.length} convites</small></h3>
      <div class="grande-num">${rc.pessoas.sim} <small>pessoas confirmadas de ${rc.total}</small></div>
      ${barra(Object.keys(RSVP).map((k) => [rc.pessoas[k], RSVP[k][1]]), rc.total)}
      <div class="legenda">${Object.entries(RSVP).map(([k, [n, cor]]) => `<span style="--c:${cor}">${n}: ${rc.c[k]}</span>`).join('')}</div></article>
    <article class="card" data-ir="tarefas"><h3>Checklist <small>${feitas}/${e.tarefas.length}</small></h3>
      <div class="grande-num">${pctT}% <small>pronto</small></div>
      ${barra([[feitas, '#2f855a']], e.tarefas.length)}
      <ul class="prox-tarefas">${pend.map((t) => `<li class="${t.prazo && t.prazo < hojeISO() ? 'atrasada' : ''}"><span>${escapar(t.txt)}</span><small>${t.prazo ? (t.prazo < hojeISO() ? 'atrasada' : `até ${dataBR(t.prazo)}`) : ''}</small></li>`).join('') || '<li>Tudo feito! 🎉</li>'}</ul></article>
    <article class="card" data-ir="orcamento"><h3>Orçamento <small>${orcTot ? brl(orcTot) : 'sem limite definido'}</small></h3>
      <div class="grande-num" style="${sobra < 0 ? 'color:var(--vermelho)' : ''}">${brl(ro.comprometido)} <small>${orcTot ? (sobra >= 0 ? `· sobram ${brl(sobra)}` : `· ${brl(-sobra)} acima`) : 'comprometidos'}</small></div>
      ${barra([[ro.pago, '#2f855a'], [ro.comprometido - ro.pago, '#c19a4b']], Math.max(orcTot, ro.comprometido))}
      <div class="legenda"><span style="--c:#2f855a">Pago ${brl(ro.pago)}</span><span style="--c:#c19a4b">A pagar ${brl(ro.comprometido - ro.pago)}</span></div></article>
  </div>
  <div class="geral-baixo">
    <article class="card" data-ir="cronograma"><h3>Cronograma do dia <small>${e.cron.length} atividades</small></h3>
      <ul class="prox-tarefas">${proxCron.map((c) => `<li><span><b>${c.hora}</b> · ${escapar(c.txt)}</span><small>${escapar(c.resp)}</small></li>`).join('') || '<li>Nada no cronograma ainda.</li>'}</ul></article>
    <article class="card" data-ir="convidados"><h3>Para o buffet</h3>
      <p style="margin:0">Conte com <b>${rc.pessoas.sim + rc.pessoas.talvez}</b> pessoas (confirmados + talvez).${rc.pessoas.pendente ? ` Ainda faltam respostas de <b>${rc.c.pendente}</b> ${rc.c.pendente === 1 ? 'convite' : 'convites'}.` : ''}</p>
      ${rc.pessoas.sim ? `<p style="margin:8px 0 0;color:var(--suave);font-size:14px">Custo por pessoa confirmada: <b style="color:var(--tinta)">${brl(ro.comprometido / rc.pessoas.sim)}</b></p>` : ''}</article>
  </div>`;
}
$('#v-geral').addEventListener('click', (e) => { const c = e.target.closest('[data-ir]'); if (c) trocarAba(c.dataset.ir); });

/* ---------- Convidados ---------- */
function desenharConvidados() {
  const e = ev(); if (!e) return;
  const rc = resumoConv(e);
  $('#cv-filtro').innerHTML = [['todos', `Todos ${e.convidados.length}`], ...Object.entries(RSVP).map(([k, [n]]) => [k, `${n} ${rc.c[k]}`])].map(([k, t]) => `<button data-f="${k}" aria-pressed="${k === filtroConv}">${t}</button>`).join('');
  const f = $('#cv-busca').value.trim().toLowerCase();
  const lista = e.convidados.filter((c) => (filtroConv === 'todos' || c.rsvp === filtroConv) && (!f || `${c.nome} ${c.grupo}`.toLowerCase().includes(f)));
  const grupos = [...new Set(lista.map((c) => c.grupo || 'Sem grupo'))].sort();
  $('#grupos').innerHTML = [...new Set(e.convidados.map((c) => c.grupo).filter(Boolean))].map((g) => `<option value="${escapar(g)}">`).join('');
  $('#lista-conv').innerHTML = lista.length ? grupos.map((g) => `<li class="grupo-tit">${escapar(g)}</li>` + lista.filter((c) => (c.grupo || 'Sem grupo') === g).sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => `
    <li class="conv" data-id="${c.id}"><span class="ini" aria-hidden="true">${escapar(c.nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase())}</span>
      <span><b>${escapar(c.nome)}</b><small>${+c.acomp ? `+${c.acomp} acompanhante${+c.acomp > 1 ? 's' : ''}` : 'sem acompanhante'}</small></span>
      <span class="rsvp" role="group" aria-label="Resposta de ${escapar(c.nome)}">${[['sim', '✓ Vai'], ['talvez', 'Talvez'], ['nao', '✕ Não']].map(([k, t]) => `<button data-r="${k}" aria-pressed="${c.rsvp === k}">${t}</button>`).join('')}</span>
      <button class="mini-x" data-x aria-label="Remover ${escapar(c.nome)}">✕</button></li>`).join('')).join('')
    : `<li class="vazio">${e.convidados.length ? 'Ninguém com esse filtro.' : 'Adicione o primeiro convidado acima, ou cole uma lista inteira.'}</li>`;
}
$('#form-conv').addEventListener('submit', (x) => {
  x.preventDefault();
  const nome = $('#cv-nome').value.trim(); if (!nome) return;
  ev().convidados.push({ id: uid(), nome, grupo: $('#cv-grupo').value.trim(), acomp: Math.max(0, +$('#cv-acomp').value || 0), rsvp: 'pendente' });
  $('#cv-nome').value = ''; $('#cv-acomp').value = 0; salvar(); desenharConvidados(); $('#cv-nome').focus();
});
$('#lista-conv').addEventListener('click', (x) => {
  const li = x.target.closest('.conv'); if (!li) return;
  const e = ev(), c = e.convidados.find((k) => String(k.id) === li.dataset.id);
  const r = x.target.closest('[data-r]');
  if (r) { c.rsvp = c.rsvp === r.dataset.r ? 'pendente' : r.dataset.r; salvar(); desenharConvidados(); return; }
  const del = x.target.closest('[data-x]');
  if (del) { if (del.textContent !== '?') { del.textContent = '?'; del.title = 'Clique de novo para remover'; return; } e.convidados = e.convidados.filter((k) => k !== c); salvar(); desenharConvidados(); }
});
$('#cv-filtro').addEventListener('click', (x) => { const b = x.target.closest('[data-f]'); if (b) { filtroConv = b.dataset.f; desenharConvidados(); } });
$('#cv-busca').addEventListener('input', desenharConvidados);
$('#cv-colar').addEventListener('click', () => { $('#colar-txt').value = ''; $('#colar-grupo').value = ''; $('#dlg-colar').returnValue = ''; $('#dlg-colar').showModal(); });
$('#dlg-colar').addEventListener('close', () => {
  if ($('#dlg-colar').returnValue !== 'salvar') return;
  const grupo = $('#colar-grupo').value.trim(), novos = [];
  $('#colar-txt').value.split('\n').forEach((l) => {
    l = l.replace(/^\s*[-•*\d.)]+\s*/, '').trim(); if (!l) return;
    const m = l.match(/^(.*?)\s*\+\s*(\d+)$/);
    novos.push({ id: uid() + novos.length, nome: (m ? m[1] : l).trim(), grupo, acomp: m ? +m[2] : 0, rsvp: 'pendente' });
  });
  ev().convidados.push(...novos); salvar(); desenharConvidados(); toast(`${novos.length} convidados adicionados`);
});
$('#cv-exportar').addEventListener('click', () => {
  const e = ev(), q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Nome', 'Grupo', 'Acompanhantes', 'Total de pessoas', 'Resposta'].map(q).join(';'), ...e.convidados.map((c) => [c.nome, c.grupo, c.acomp, 1 + (+c.acomp || 0), RSVP[c.rsvp][0]].map(q).join(';'))];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = `convidados-${e.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\W+/g, '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Lista de convidados baixada');
});

/* ---------- Checklist ---------- */
function desenharTarefas() {
  const e = ev(); if (!e) return;
  const hoje = hojeISO();
  const grupos = [
    ['⚠️ Atrasadas', e.tarefas.filter((t) => !t.feita && t.prazo && t.prazo < hoje)],
    ['📅 Próximas', e.tarefas.filter((t) => !t.feita && (!t.prazo || t.prazo >= hoje))],
    ['✓ Concluídas', e.tarefas.filter((t) => t.feita)]
  ];
  $('#lista-tarefas').innerHTML = e.tarefas.length ? grupos.filter(([, l]) => l.length).map(([tit, l]) => `<section class="grupo-tarefas"><h3>${tit}<small>${l.length}</small></h3><ul>${l.sort((a, b) => (a.prazo || '9').localeCompare(b.prazo || '9')).map((t) => `
    <li class="tarefa ${t.feita ? 'feita' : ''} ${!t.feita && t.prazo && t.prazo < hoje ? 'atrasada' : ''}" data-id="${t.id}">
      <input type="checkbox" ${t.feita ? 'checked' : ''} aria-label="Concluir: ${escapar(t.txt)}">
      <span class="txt">${escapar(t.txt)}</span>${t.resp ? `<small>👤 ${escapar(t.resp)}</small>` : ''}${t.prazo ? `<small class="prazo">${dataBR(t.prazo)}</small>` : ''}
      <button class="mini-x" data-x aria-label="Remover tarefa">✕</button></li>`).join('')}</ul></section>`).join('')
    : '<p class="vazio">Nenhuma tarefa ainda. Adicione acima.</p>';
}
$('#form-tarefa').addEventListener('submit', (x) => {
  x.preventDefault();
  const e = ev(), txt = $('#tf-txt').value.trim(); if (!txt) return;
  e.tarefas.push({ id: uid(), txt, prazo: $('#tf-data').value, resp: $('#tf-resp').value.trim(), feita: false });
  $('#tf-txt').value = ''; salvar(); desenharTarefas(); $('#tf-txt').focus();
});
$('#lista-tarefas').addEventListener('change', (x) => {
  const li = x.target.closest('.tarefa'); if (!li) return;
  const t = ev().tarefas.find((k) => String(k.id) === li.dataset.id); t.feita = x.target.checked;
  salvar(); desenharTarefas();
  const e = ev(); if (e.tarefas.every((k) => k.feita)) toast('🎉 Checklist completa!');
});
$('#lista-tarefas').addEventListener('click', (x) => {
  const b = x.target.closest('[data-x]'); if (!b) return;
  const id = b.closest('.tarefa').dataset.id; ev().tarefas = ev().tarefas.filter((k) => String(k.id) !== id); salvar(); desenharTarefas();
});

/* ---------- Orçamento ---------- */
$('#or-cat').innerHTML = CATS_ORC.map((c) => `<option>${c}</option>`).join('');
function desenharOrcamento() {
  const e = ev(); if (!e) return;
  const ro = resumoOrc(e), tot = +e.orcamento || 0, sobra = tot - ro.comprometido;
  $('#orc-resumo').innerHTML = `<div><small>Orçamento total</small><b>${tot ? brl(tot) : '—'}</b></div><div><small>Comprometido</small><b>${brl(ro.comprometido)}</b></div>
    <div class="${tot ? (sobra < 0 ? 'ruim' : 'bom') : ''}"><small>${sobra < 0 ? 'Acima do orçamento' : 'Disponível'}</small><b>${tot ? brl(Math.abs(sobra)) : '—'}</b></div><div><small>Já pago</small><b>${brl(ro.pago)}</b></div>`;
  const itens = [...e.orc].sort((a, b) => CATS_ORC.indexOf(a.cat) - CATS_ORC.indexOf(b.cat));
  $('#tabela-orc').innerHTML = `<thead><tr><th>Item</th><th class="n col-prev">Previsto</th><th class="n">Real</th><th class="n col-prev">Diferença</th><th>Pago</th><th></th></tr></thead>
    <tbody>${itens.map((x) => {
      const dif = x.real ? x.real - x.prev : 0;
      return `<tr data-id="${x.id}"><td><b>${escapar(x.item)}</b><br><span class="cat-pill">${escapar(x.cat)}</span></td>
        <td class="n col-prev"><input class="valor" type="number" min="0" step="0.01" data-campo="prev" value="${x.prev || ''}" aria-label="Previsto"></td>
        <td class="n"><input class="valor" type="number" min="0" step="0.01" data-campo="real" value="${x.real || ''}" placeholder="—" aria-label="Valor real"></td>
        <td class="n col-prev ${dif > 0 ? 'dif-mais' : dif < 0 ? 'dif-menos' : ''}">${dif ? (dif > 0 ? '+' : '−') + brl(Math.abs(dif)) : '—'}</td>
        <td><input type="checkbox" class="pago" ${x.pago ? 'checked' : ''} aria-label="Pago"></td><td><button class="mini-x" data-x aria-label="Remover item">✕</button></td></tr>`;
    }).join('') || '<tr><td colspan="6" class="vazio">Nenhum gasto lançado.</td></tr>'}</tbody>
    ${itens.length ? `<tfoot><tr><td>Total</td><td class="n col-prev">${brl(ro.prev)}</td><td class="n">${brl(ro.real)}</td><td class="col-prev"></td><td colspan="2"></td></tr></tfoot>` : ''}`;
}
$('#form-orc').addEventListener('submit', (x) => {
  x.preventDefault();
  const item = $('#or-item').value.trim(); if (!item) return;
  ev().orc.push({ id: uid(), item, cat: $('#or-cat').value, prev: +$('#or-prev').value || 0, real: +$('#or-real').value || 0, pago: false });
  ['#or-item', '#or-prev', '#or-real'].forEach((s) => { $(s).value = ''; });
  salvar(); desenharOrcamento(); $('#or-item').focus();
});
$('#tabela-orc').addEventListener('change', (x) => {
  const tr = x.target.closest('tr[data-id]'); if (!tr) return;
  const it = ev().orc.find((k) => String(k.id) === tr.dataset.id);
  if (x.target.classList.contains('pago')) it.pago = x.target.checked;
  else if (x.target.dataset.campo) it[x.target.dataset.campo] = Math.max(0, +x.target.value || 0);
  salvar(); desenharOrcamento();
});
$('#tabela-orc').addEventListener('click', (x) => {
  const b = x.target.closest('[data-x]'); if (!b) return;
  const id = b.closest('tr').dataset.id; ev().orc = ev().orc.filter((k) => String(k.id) !== id); salvar(); desenharOrcamento();
});

/* ---------- Cronograma ---------- */
function desenharCronograma() {
  const e = ev(); if (!e) return;
  const agora = new Date(), ehHoje = e.data === hojeISO(), hm = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  const itens = [...e.cron].sort((a, b) => a.hora.localeCompare(b.hora));
  const atual = ehHoje ? [...itens].reverse().find((c) => c.hora <= hm) : null;
  $('#cronograma').innerHTML = itens.map((c) => `<li class="cron ${c === atual ? 'agora' : ''}" data-id="${c.id}"><span class="hora">${c.hora}</span><div><b>${escapar(c.txt)}</b>${c.resp ? `<small>${escapar(c.resp)}</small>` : ''}</div><button class="mini-x" data-x aria-label="Remover">✕</button></li>`).join('') || '<li class="vazio">Monte a programação do dia: horário e atividade.</li>';
  $('#cr-copiar').hidden = !itens.length;
}
$('#form-cron').addEventListener('submit', (x) => {
  x.preventDefault();
  const txt = $('#cr-txt').value.trim(), hora = $('#cr-hora').value; if (!txt || !hora) return;
  ev().cron.push({ id: uid(), hora, txt, resp: $('#cr-resp').value.trim() });
  $('#cr-txt').value = ''; $('#cr-resp').value = ''; salvar(); desenharCronograma(); $('#cr-hora').focus();
});
$('#cronograma').addEventListener('click', (x) => { const b = x.target.closest('[data-x]'); if (!b) return; const id = b.closest('.cron').dataset.id; ev().cron = ev().cron.filter((k) => String(k.id) !== id); salvar(); desenharCronograma(); });
$('#cr-copiar').addEventListener('click', async () => {
  const e = ev();
  const txt = `📋 ${e.nome} — ${dataBR(e.data, { day: '2-digit', month: '2-digit', year: 'numeric' })}${e.local ? `\n📍 ${e.local}` : ''}\n\n` + [...e.cron].sort((a, b) => a.hora.localeCompare(b.hora)).map((c) => `${c.hora} · ${c.txt}${c.resp ? ` (${c.resp})` : ''}`).join('\n');
  try { await navigator.clipboard.writeText(txt); toast('Cronograma copiado'); } catch { toast('Não foi possível copiar'); }
});

/* ---------- Eventos ---------- */
let editando = null;
$('#ev-tipos').innerHTML = Object.entries(TIPOS).map(([k, [ic, n]]) => `<label><input type="radio" name="ev-tipo" value="${k}"><span>${ic}<b>${n}</b></span></label>`).join('');
function abrirEvento(e) {
  editando = e; $('#dlg-evento').returnValue = '';
  $('#de-titulo').textContent = e ? 'Editar evento' : 'Novo evento';
  $('#ev-nome').value = e?.nome ?? ''; $('#ev-data').value = e?.data ?? ''; $('#ev-hora').value = e?.hora ?? ''; $('#ev-local').value = e?.local ?? ''; $('#ev-orc').value = e?.orcamento || '';
  document.querySelector(`[name=ev-tipo][value=${e?.tipo ?? 'aniversario'}]`).checked = true;
  $('#ev-modelo-box').hidden = !!e;
  const ex = $('#excluir-evento'); ex.hidden = !e || dados.eventos.length < 2; ex.textContent = 'Excluir evento';
  $('#dlg-evento').showModal();
}
$('#novo-evento').addEventListener('click', () => abrirEvento(null));
$('#editar-evento').addEventListener('click', () => abrirEvento(ev()));
$('#evento-sel').addEventListener('change', (x) => { dados.atual = +x.target.value; salvar(); desenharTudo(); });
$('#dlg-evento').addEventListener('close', () => {
  if ($('#dlg-evento').returnValue !== 'salvar') return;
  const d = { nome: $('#ev-nome').value.trim(), tipo: document.querySelector('[name=ev-tipo]:checked').value, data: $('#ev-data').value, hora: $('#ev-hora').value, local: $('#ev-local').value.trim(), orcamento: +$('#ev-orc').value || 0 };
  if (editando) Object.assign(editando, d);
  else {
    const novo = { id: uid(), ...d, convidados: [], tarefas: [], orc: [], cron: [] };
    if ($('#ev-modelo').checked) {
      const dt = new Date(d.data + 'T12:00');
      novo.tarefas = MODELOS[d.tipo].map(([txt, antes], i) => { const p = new Date(dt); p.setDate(p.getDate() - antes); return { id: uid() + i, txt, prazo: iso(p), resp: '', feita: false }; });
    }
    dados.eventos.push(novo); dados.atual = novo.id;
  }
  salvar(); desenharTudo(); toast(editando ? 'Evento atualizado' : 'Evento criado 🎉');
});
$('#excluir-evento').addEventListener('click', (x) => {
  if (x.target.textContent !== 'Confirmar exclusão') { x.target.textContent = 'Confirmar exclusão'; return; }
  dados.eventos = dados.eventos.filter((e) => e !== editando); dados.atual = dados.eventos[0]?.id;
  salvar(); desenharTudo(); $('#dlg-evento').close('excluir'); toast('Evento excluído');
});

/* ---------- Abas ---------- */
function trocarAba(a) {
  aba = a; $$('[data-aba]').forEach((b) => b.setAttribute('aria-selected', b.dataset.aba === a));
  $$('.painel-aba').forEach((p) => { p.hidden = p.id !== `v-${a}`; });
  desenharAba();
}
function desenharAba() { ({ geral: desenharGeral, convidados: desenharConvidados, tarefas: desenharTarefas, orcamento: desenharOrcamento, cronograma: desenharCronograma })[aba](); }
$$('[data-aba]').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
function desenharTudo() { desenharTopo(); desenharAba(); }

let timerToast;
function toast(msg) { const t = $('#toast'); (document.querySelector('dialog[open]') || document.body).append(t); t.textContent = msg; t.hidden = false; clearTimeout(timerToast); timerToast = setTimeout(() => { t.hidden = true; }, 2400); }

desenharTudo();
setInterval(desenharTopo, 30000);

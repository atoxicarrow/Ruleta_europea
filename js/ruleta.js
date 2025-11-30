(function () {
  'use strict';                 // HACE QUE EL CODIGO SE EJECUTE EN MODO ESTRICTO (NO VARIABLES DUPLICADAS, IMPLICITAS O MAL DEFINIDAS, ETC)

  const LS_KEYS = {                 // OBJETO QUE GUARDA NOMBRE QUE SE USARÁN EN LOCALSTORAGE
    BALANCE: 'casino_balance',      // VARIABLES (KEYS) QUE SE USARAN EN EL LOCALSTORAGE
    BETS: 'casino_bets',            //
    WINNERS: 'casino_winners',      //
    PLAYS: 'casino_plays',          //
    LOCK: 'casino_lock',            //
    SPINNING: 'casino_spinning'     //
  };
  const DEFAULT_BALANCE = 245000;   // SALDO INICIAL
  const MIN_BET = 1000;             // APUESTA MINIMA
  const SECTORS = 37;               // NUMERO DE SECTORES EN LA RULETA (0-36)
  const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const BLACKS = new Set([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]);
  const esRojo = (n) => REDS.has(n);    // funcion que verifica si un numero es rojo



  const ui = {                     // SON REFERENCIAS A ELEMENTOS DEL HTML  
    canvas: document.getElementById('ruletacanvas'),
    contexto: null,                // EVITA QUE EL PROGRAMA CRASHEE SI ES QUE CANVAS NO CAGARGA BIEN
    saldo: document.getElementById('saldo'),
    infoSaldo: document.getElementById('info-saldo-span'),
    ultimoResultado: document.getElementById('ultimo-resultado'),
    estado: document.getElementById('ruleta-estado'),
    betTable: document.getElementById('bet-table'),
    startSpinBtn: document.getElementById('btngirar'),
    
    betModal: {
      overlay: document.getElementById('bet-modal'),
      title: document.getElementById('bet-modal-title'),
      desc: document.getElementById('bet-modal-desc'),
      input: document.getElementById('bet-amount'),
      closeBtn: document.getElementById('close-bet-modal'),
      saveBtn: document.getElementById('save-bet'),
      cancelBtn: document.getElementById('cancel-bet'),
    },
    
    resultModal: {
      overlay: document.getElementById('result-modal'),
      body: document.getElementById('result-body'),
      closeBtn: document.getElementById('close-result-modal'),
      ackBtn: document.getElementById('ack-result'),
    }
  };
  if (ui.canvas) ui.contexto = ui.canvas.getContext('2d'); // SE DIVIDE EN 2, IF(UI.CANVAS) COMPRUEBA SI EL CANVAS EXISTE, LA SEGUNDA PARTE LE DA PRIVILIEGIOS DE DIBUJO. 


  let state = { // ES EL ESTADO ACTUAL DE LA PAGINA
    balance: DEFAULT_BALANCE,
    bets: {},
    spinning: false,
    currentBetKey: null // TERMPORALEMENTE GUARDA LA APUESTA ACTUAL
  };


  const saveLS = (key, value) => localStorage.setItem(key, JSON.stringify(value));    // ATAJO PARA GUARDAR EN LOCALSTORAGE
  const loadLS = (key, fallback) => {     // ARAJO PARA CARGAR DESDE LOCALSTORAGE  (=> es lo mismo que decir return)
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  };
  const formatMoney = (n) => '$' + n.toLocaleString('es-CL'); // PONE LA PLATA EN CHILENO EJ: 1000 => $1.000
  const formatWinner = (n) => {
    if (n === 0) return '0 (Verde)'; // SI SALE 0, ES VERDE
    return `${n} ${REDS.has(n) ? 'Rojo' : 'Negro'}`; // SI SALE CUALQUIER OTRO USA RED.HAS(N) PARA VER QUE EL NUMERO ESTE DENTRO DEL ARRAY ROJO Y SI NO ESTA, CON ":" DE DICE QUE ES NEGRO
  };
  const totalBets = (bets) => Object.values(bets).reduce((s, b) => s + (b.amount || 0), 0); // SUMA EL TOTAL DE LAS APUESTAS QUE HIZO EL USUARIO  || 0 SIRVE SI EL VALOR ES NULL, ENTONCES DEVUELVE 0

  //SINCRONIZACIÓN || SE ASEGURA QUE EL LS SIEMPRE TENGA DATOS Y QUE MUESTRE ESOS DATOS
  function initStorage() {  // REVISA SI EN LS HAY DATOS, SI NO HAY PONE UNOS POR DEFAULT  
    const defaults = {
      [LS_KEYS.BALANCE]: DEFAULT_BALANCE,
      [LS_KEYS.BETS]: {},
      [LS_KEYS.WINNERS]: [],
      [LS_KEYS.PLAYS]: [],
      [LS_KEYS.LOCK]: { locked: false, amount: 0 },
      [LS_KEYS.SPINNING]: false
    };


    for (const [key, value] of Object.entries(defaults)) {
      if (localStorage.getItem(key) === null) {
        saveLS(key, value);
      }
    }
  }

  function refreshUI() { // LEE LOS DATOS DEL LS Y ACTUALIZA LA INTERFAZ
    state.balance = loadLS(LS_KEYS.BALANCE, DEFAULT_BALANCE);
    state.bets = loadLS(LS_KEYS.BETS, {});
    
    const balanceFormateado = formatMoney(state.balance);
    if (ui.saldo) ui.saldo.textContent = balanceFormateado;
    if (ui.infoSaldo) ui.infoSaldo.textContent = balanceFormateado;

    document.querySelectorAll('.bet-cell').forEach(td => {
      const key = td.dataset.key || td.closest('tr').dataset.betkey;
      const bet = state.bets[key];
      td.textContent = bet ? formatMoney(bet.amount) : '-';
      td.closest('tr')?.classList.toggle('bet-indicator', !!bet);
    });

    const winners = loadLS(LS_KEYS.WINNERS, []);
    if (ui.ultimoResultado) {
      ui.ultimoResultado.textContent = winners.length > 0 ? formatWinner(winners[winners.length - 1].number) : '-';
    }
  }

  function disableBetting(disabled) { // DESACTIVA EL BOTON DE APUESTAS SI LA RULETA ESTA GIRANDO
    document.querySelectorAll('tr[data-betkey]').forEach(r => {
      r.classList.toggle('disabled', disabled);
    });
    if (ui.startSpinBtn) ui.startSpinBtn.disabled = disabled;
  }

  //MODALE
  function openBetModal(key) { // MUESTRA EL MODAL DE APUESTAS
    if (state.spinning || !ui.betModal.overlay) return;
    state.currentBetKey = key;
    const bet = state.bets[key];
    ui.betModal.overlay.classList.add('active');
    ui.betModal.overlay.setAttribute('aria-hidden', 'false');
    ui.betModal.title.textContent = bet ? `Editar apuesta: ${key}` : `Crear apuesta: ${key}`;
    ui.betModal.desc.textContent = `Saldo: ${formatMoney(state.balance)}. Mínimo: ${formatMoney(MIN_BET)}`;
    ui.betModal.input.value = bet ? bet.amount : '';
    ui.betModal.input.focus();
  }

  function closeBetModal() { // CIERRA EL MODAL DE APUESTAS
    if (!ui.betModal.overlay) return;
    ui.betModal.overlay.classList.remove('active');
    ui.betModal.overlay.setAttribute('aria-hidden', 'true');
    state.currentBetKey = null;
  }

  function showResultModal(finalNumber, outcomes, before, after) {  //MUESTRA EL MODAL DE RESULTADOS
    if (!ui.resultModal.overlay || !ui.resultModal.body) return;

    const outcomeList = outcomes
      .map(o => `<li>${o.key} — ${o.win ? `GANÓ (+${formatMoney(o.amount)})` : 'PERDIÓ'} — ${formatMoney(o.amount)}</li>`)
      .join('');

      ui.resultModal.body.innerHTML = `
      <p><strong>Número ganador:</strong> ${formatWinner(finalNumber)}</p>
      <hr>
      <h4>Desglose de apuestas</h4>
      <ul>${outcomeList}</ul>
      <hr>
      <p><strong>Saldo antes:</strong> ${formatMoney(before)}</p>
      <p><strong>Saldo después:</strong> ${formatMoney(after)}</p>
    `;

    ui.resultModal.overlay.classList.add('active');
    ui.resultModal.overlay.setAttribute('aria-hidden', 'false');
  }

  function closeResultModal() { // CIERRA EL MODAL DE RESULTADOS
    if (!ui.resultModal.overlay) return;
    ui.resultModal.overlay.classList.remove('active');
    ui.resultModal.overlay.setAttribute('aria-hidden', 'true');
  }

  // --- LÓGICA DEL JUEGO ---
  async function startSpin() { // LLAMA A LA FUNCION INICIAR SORTEO, VERIFICA QUE NO HAYA APUESTAS INVALIDAS Y BLOQUEA EL MONTO APOSTADO. 
    if (state.spinning) return;
    const bets = loadLS(LS_KEYS.BETS, {});
    if (Object.keys(bets).length === 0) return alert('No hay apuestas activas.');
    
    const balanceNow = loadLS(LS_KEYS.BALANCE, DEFAULT_BALANCE);
    const total = totalBets(bets);
    if (total > balanceNow) {
      alert('Error: Apuestas superan el saldo. Se reinicia la mesa.');
      saveLS(LS_KEYS.BETS, {});
      refreshUI();
      return;
    }

    saveLS(LS_KEYS.LOCK, { locked: true, amount: total }); //GUARDA EN EL LS EL MONTO BLOQUEADO
    saveLS(LS_KEYS.SPINNING, true);
    state.spinning = true;
    if (ui.estado) ui.estado.textContent = 'La ruleta está girando...';
    disableBetting(true);

    const duration = 3000 + Math.floor(Math.random() * 4000);
    const finalNumber = Math.floor(Math.random() * 37);

    await animateWheelToNumber(finalNumber, duration);
    
    finishSpin(finalNumber);
  }

  function animateWheelToNumber(number, duration) { //ES UNA TRANSICION DE CSS QUE HACE GIRAR LA RULETA HASTA EL NUMERO GANADOR.
    return new Promise((resolve) => {  // PROMESA QUE SE RESUELVE CUANDO LA ANIMACION TERMINA PARA INFORMARLE AL STARTSPIN QUE TERMINO
      if (!ui.canvas) return resolve();
      
      const idx = WHEEL_ORDER.indexOf(number); // POSICION DEL NUMERO GANADOR EN WHEEL ORDER -----  
      const anglePer = 360 / SECTORS;
      const spins = 10 + Math.floor(Math.random() * 5);
      const jitter = (Math.random() - 0.5) * anglePer * 0.6;
      const target = spins * 360 - (idx * anglePer) + jitter - 95; // AJUSTE PARA QUE EL GANADOR QUEDE SIEMPRE ARRIBA

      ui.canvas.style.transition = `transform ${duration}ms cubic-bezier(0.33, 1, 0.68, 1)`; 
      ui.canvas.style.transform = `rotate(${target}deg)`;

      setTimeout(() => { //TIEMPO DE ESPERA ANTES DE RESOLVER LA PROMESA
        const finalNorm = target % 360;
        ui.canvas.style.transition = 'none';
        ui.canvas.style.transform = `rotate(${finalNorm}deg)`;
        resolve();
      }, duration + 50);
    });
  }

  function checkWin(key, number) { //REVISA SI LA APUESTA GANÓ O PERDIÓ
    if (number === 0) return false;
    switch (key) {
      case 'rojo': return REDS.has(number);
      case 'negro': return BLACKS.has(number);
      case 'par': return (number % 2 === 0);
      case 'impar': return (number % 2 === 1);
      case 'bajo': return (number >= 1 && number <= 18);
      case 'alto': return (number >= 19 && number <= 36);
      default: return false;
    }
  }

  function finishSpin(finalNumber) { //LUEGO DE TERMINAR CON LA ANIMACION
    const bets = loadLS(LS_KEYS.BETS, {});
    const balanceNow = loadLS(LS_KEYS.BALANCE, DEFAULT_BALANCE);
    const lock = loadLS(LS_KEYS.LOCK, { locked: false, amount: 0 });

    saveLS(LS_KEYS.LOCK, { locked: false, amount: 0 });
    saveLS(LS_KEYS.SPINNING, false);
    state.spinning = false;
    disableBetting(false);  //ACTIVA LAS APUESTAS

    if (balanceNow < lock.amount) { //CALCULO DE GANANCIA
      alert('Partida inválida: Saldo modificado. Mesa reiniciada.');
      saveLS(LS_KEYS.BETS, {});
      refreshUI();
      if (ui.estado) ui.estado.textContent = 'Partida inválida - mesa reiniciada';
      return;
    }

    const outcomes = [];
    let profit = 0; // VARIABLE DE GANANCIA
    
    for (const [key, bet] of Object.entries(bets)) { // CALCULA LAS GANANCIAS Y PÉRDIDAS DE CADA APUESTA
      const amt = bet.amount || 0;
      const win = checkWin(key, finalNumber);
      const payout = 1; // Pago 1:1

      outcomes.push({ key, amount: amt, win });
      
      if (win) {
        profit += (amt * payout);
      } else {
        profit -= amt;
      }
    }

    const newBalance = balanceNow + profit; //NUEVO SALDO
    saveLS(LS_KEYS.BALANCE, newBalance);

    // GUARDA EN EL LS EL RESULTADO DE LA PARTIDA
    const plays = loadLS(LS_KEYS.PLAYS, []);
    plays.push({ ts: new Date().toISOString(), number: finalNumber, bets, outcomes, before: balanceNow, after: newBalance });     //REVISAR
    saveLS(LS_KEYS.PLAYS, plays);
    const winners = loadLS(LS_KEYS.WINNERS, []);
    winners.push({ number: finalNumber, ts: new Date().toISOString() });
    saveLS(LS_KEYS.WINNERS, winners);

    saveLS(LS_KEYS.BETS, {});
    refreshUI();
    if (ui.estado) ui.estado.textContent = `Último resultado: ${formatWinner(finalNumber)}`;
    showResultModal(finalNumber, outcomes, balanceNow, newBalance);
  }

  // --- DIBUJO DEL CANVAS ---
  function dibujarRuleta() {
    if (!ui.contexto || !ui.canvas) return;
    const ctx = ui.contexto;
    const radio = ui.canvas.width / 2;
    const anguloPorNumero = (2 * Math.PI) / SECTORS;

    ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    WHEEL_ORDER.forEach((n, i) => {
      const anguloInicio = i * anguloPorNumero;
      const anguloMedio = anguloInicio + anguloPorNumero / 2;

      ctx.beginPath();
      ctx.moveTo(radio, radio);
      ctx.fillStyle = n === 0 ? '#2e7d32' : esRojo(n) ? '#cc3a3a' : '#111';
      ctx.arc(radio, radio, radio, anguloInicio, (i + 1) * anguloPorNumero);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(radio, radio);
      ctx.rotate(anguloMedio);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(n.toString(), radio * 0.9, 5);
      ctx.restore();
    });

    // Indicador (re-dibujado por si acaso, aunque está en el HTML)
    // dibujarIndicadorBola(ctx, radio);
  }

  // --- MANEJADORES DE EVENTOS ---
  // (Funciones que se llaman desde bindEvents)

  function onBetTableClick(e) {
    const tr = e.target.closest('tr[data-betkey]');
    if (!tr) return;
    openBetModal(tr.dataset.betkey);
  }

  function saveBet() {
    const key = state.currentBetKey;
    if (!key) return;
    const amount = Math.round(Number(ui.betModal.input.value) || 0);
    
    if (!Number.isInteger(amount) || amount < MIN_BET) {
      return alert(`Monto inválido. Mínimo ${formatMoney(MIN_BET)}`);
    }
    const other = { ...state.bets };
    delete other[key];
    
    if (totalBets(other) + amount > state.balance) {
      return alert('No hay saldo suficiente para esta apuesta.');
    }
    
    state.bets[key] = { amount };
    saveLS(LS_KEYS.BETS, state.bets);
    refreshUI();
    closeBetModal();
  }

  function cancelBet() {
    const key = state.currentBetKey;
    if (!key) return;
    if (state.bets[key]) {
      delete state.bets[key];
      saveLS(LS_KEYS.BETS, state.bets);
      refreshUI();
    }
    closeBetModal();
  }

  // --- INICIALIZACIÓN ---
  // Centraliza todos los event listeners
  function bindEvents() { // ASIGNA TODAS LAS FUNCIONES A SUS RESPECTIVOS BOTONES Y ELEMENTOS DE HTML
    if (ui.startSpinBtn) ui.startSpinBtn.addEventListener('click', startSpin);
    if (ui.betTable) ui.betTable.addEventListener('click', onBetTableClick);
    
    // Eventos del modal de apuestas
    if (ui.betModal.saveBtn) ui.betModal.saveBtn.addEventListener('click', saveBet);
    if (ui.betModal.cancelBtn) ui.betModal.cancelBtn.addEventListener('click', cancelBet);
    if (ui.betModal.closeBtn) ui.betModal.closeBtn.addEventListener('click', closeBetModal);
    
    // Eventos del modal de resultados
    if (ui.resultModal.closeBtn) ui.resultModal.closeBtn.addEventListener('click', closeResultModal);
    if (ui.resultModal.ackBtn) ui.resultModal.ackBtn.addEventListener('click', closeResultModal);
  }

  function init() {   //SE EJECUTA AL INICIAR LA PAGINA E INICIA EL SCRIPT
    initStorage();
    refreshUI();
    dibujarRuleta();
    bindEvents(); // Asigna los eventos al iniciar
  }

  init();

})();
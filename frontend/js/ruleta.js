(function () { 
  'use strict';

  // Configuración de la Ruleta Visual
  const SECTORS = 37;
  const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const esRojo = (n) => REDS.has(n);

  const ui = {
    canvas: document.getElementById('ruletacanvas'),
    contexto: null,
    saldo: document.getElementById('saldo'),
    estado: document.getElementById('ruleta-estado'),
    betTable: document.getElementById('bet-table'),
    startSpinBtn: document.getElementById('btngirar'),
    betModal: {
      overlay: document.getElementById('bet-modal'),
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
  if (ui.canvas) ui.contexto = ui.canvas.getContext('2d');

  // Estado local (Solo para UI, la verdad está en el backend)
  const state = {
    balance: 0,
    bets: [], // Array de apuestas { type, value, amount, domElement }
    spinning: false,
    currentBetContext: null // Datos temporales para el modal
  };

  const formatMoney = (n) => '$' + n.toLocaleString('es-CL');

  // ==========================================
  // 1. CARGAR DATOS INICIALES
  // ==========================================
  async function initGame() {
    dibujarRuleta(); // Dibujo inicial
    try {
        const response = await fetch('/api/user/profile');
        if (response.status === 401) {
            alert("Debes iniciar sesión para jugar.");
            window.location.href = '/login.html';
            return;
        }
        const data = await response.json();
        state.balance = data.balance;
        updateUIBalance();
    } catch (error) {
        console.error("Error cargando perfil", error);
    }
  }

  function updateUIBalance() {
    ui.saldo.textContent = formatMoney(state.balance);
  }

  // ==========================================
  // 2. SISTEMA DE APUESTAS (UI)
  // ==========================================
  function onBetTableClick(e) {
    if (state.spinning) return;

    // Detectar clic en filas normales o especial
    const tr = e.target.closest('tr');
    if (!tr) return;

    // Caso A: Apuesta a Número Específico (Input)
    if (tr.querySelector('#input-numero')) {
        const inputNum = tr.querySelector('#input-numero');
        const numVal = inputNum.value;
        const cell = tr.querySelector('.bet-cell');

        if (e.target === inputNum) return; // Si clickea el input, dejar escribir

        if (numVal === '' || numVal < 0 || numVal > 36) {
            alert("Por favor elige un número válido (0-36) antes de apostar.");
            return;
        }
        openBetModal({ type: 'number', value: numVal, cell: cell, desc: `Número ${numVal}` });
        return;
    }

    // Caso B: Apuestas Normales (Color, Docena, Columna)
    if (tr.dataset.type) {
        const cell = tr.querySelector('.bet-cell');
        const desc = tr.cells[0].textContent;
        openBetModal({ 
            type: tr.dataset.type, 
            value: tr.dataset.value, 
            cell: cell, 
            desc: desc 
        });
    }
  }

  function openBetModal(ctx) {
    state.currentBetContext = ctx;
    
    // Buscar si ya existe apuesta en este item
    const existingBet = state.bets.find(b => b.type === ctx.type && b.value === ctx.value);
    
    ui.betModal.desc.textContent = `Apostar a: ${ctx.desc}`;
    ui.betModal.input.value = existingBet ? existingBet.amount : '';
    ui.betModal.overlay.style.display = 'flex';
    ui.betModal.input.focus();
  }

  function saveBet() {
    const amount = parseInt(ui.betModal.input.value);
    const ctx = state.currentBetContext;

    if (!amount || amount < 1000) {
        alert("Monto mínimo: $1.000");
        return;
    }

    // Actualizar o Agregar Apuesta
    const existingIndex = state.bets.findIndex(b => b.type === ctx.type && b.value === ctx.value);
    
    if (existingIndex >= 0) {
        state.bets[existingIndex].amount = amount;
    } else {
        state.bets.push({
            type: ctx.type,
            value: ctx.value,
            amount: amount,
            desc: ctx.desc,
            cell: ctx.cell
        });
    }

    // Actualizar UI de la celda
    ctx.cell.textContent = formatMoney(amount);
    ctx.cell.classList.add('active-bet');
    
    closeBetModal();
  }

  function cancelBet() {
    const ctx = state.currentBetContext;
    // Eliminar del array
    state.bets = state.bets.filter(b => !(b.type === ctx.type && b.value === ctx.value));
    
    // Limpiar UI
    ctx.cell.textContent = '-';
    ctx.cell.classList.remove('active-bet');
    closeBetModal();
  }

  function closeBetModal() {
    ui.betModal.overlay.style.display = 'none';
    state.currentBetContext = null;
  }

  // ==========================================
  // 3. GIRO DE RULETA (API + ANIMACIÓN)
  // ==========================================
  async function startSpin() {
    if (state.spinning) return;
    if (state.bets.length === 0) return alert("¡Haz al menos una apuesta!");

    // Validar saldo localmente antes de llamar
    const totalBet = state.bets.reduce((acc, b) => acc + b.amount, 0);
    if (totalBet > state.balance) {
        return alert("Saldo insuficiente para estas apuestas.");
    }

    state.spinning = true;
    ui.estado.textContent = "Girando...";
    ui.startSpinBtn.disabled = true;

    try {
        // 1. LLAMADA AL BACKEND
        const response = await fetch('/api/game/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bets: state.bets }) // Enviamos array de apuestas
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error en el juego");
        }

        // 2. ANIMACIÓN (Sabiendo el resultado)
        const duration = 4000;
        await animateWheelToNumber(data.winningNumber, duration);

        // 3. MOSTRAR RESULTADOS
        ui.estado.textContent = `Resultado: ${data.winningNumber}`;
        state.balance = data.newBalance; // Actualizar saldo real
        updateUIBalance();
        
        showResultModal(data);

        // Limpiar Mesa
        state.bets = [];
        document.querySelectorAll('.active-bet').forEach(el => {
            el.textContent = '-';
            el.classList.remove('active-bet');
        });

    } catch (error) {
        alert(error.message);
        console.error(error);
    } finally {
        state.spinning = false;
        ui.startSpinBtn.disabled = false;
    }
  }

  function animateWheelToNumber(number, duration) {
    return new Promise((resolve) => {
      const idx = WHEEL_ORDER.indexOf(number);
      const anglePer = 360 / SECTORS;
      const spins = 5; // Vueltas completas
      // Ajuste para que caiga en el centro del número
      const targetRotation = (spins * 360) - (idx * anglePer) - 90; 

      ui.canvas.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      ui.canvas.style.transform = `rotate(${targetRotation}deg)`;

      setTimeout(() => {
        // Resetear rotación para que no crezca infinitamente (opcional)
        ui.canvas.style.transition = 'none';
        const finalNorm = targetRotation % 360;
        ui.canvas.style.transform = `rotate(${finalNorm}deg)`;
        resolve();
      }, duration + 500);
    });
  }

  function showResultModal(data) {
    const color = data.winningNumber === 0 ? 'Verde' : (esRojo(data.winningNumber) ? 'Rojo' : 'Negro');
    
    let html = `<h3>¡Salió el ${data.winningNumber} (${color})!</h3>`;
    html += `<p>Ganancia total: <strong>${formatMoney(data.totalWinnings)}</strong></p><hr>`;
    html += `<ul>`;
    
    data.results.forEach(res => {
        const status = res.win ? '✅ GANÓ' : '❌ PERDIÓ';
        html += `<li>${res.desc}: ${status} (${formatMoney(res.payout)})</li>`;
    });
    html += `</ul>`;

    ui.resultModal.body.innerHTML = html;
    ui.resultModal.overlay.style.display = 'flex';
  }

  // ==========================================
  // 4. DIBUJO DEL CANVAS (Igual que tenías)
  // ==========================================
  function dibujarRuleta() {
    if (!ui.contexto) return;
    const ctx = ui.contexto;
    const w = ui.canvas.width;
    const h = ui.canvas.height;
    const radio = w / 2;
    const angulo = (2 * Math.PI) / SECTORS;

    ctx.clearRect(0, 0, w, h);
    ctx.translate(radio, radio);

    WHEEL_ORDER.forEach((n, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radio, i * angulo, (i + 1) * angulo);
      ctx.fillStyle = n === 0 ? '#008000' : (esRojo(n) ? '#b00' : '#222');
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * angulo + angulo / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(n, radio - 25, 6);
      ctx.restore();
    });
    
    ctx.resetTransform();
  }

  // EVENTOS
  ui.betTable.addEventListener('click', onBetTableClick);
  ui.startSpinBtn.addEventListener('click', startSpin);
  ui.betModal.saveBtn.addEventListener('click', saveBet);
  ui.betModal.cancelBtn.addEventListener('click', cancelBet);
  ui.betModal.closeBtn.addEventListener('click', closeBetModal);
  ui.resultModal.ackBtn.addEventListener('click', () => ui.resultModal.overlay.style.display = 'none');
  ui.resultModal.closeBtn.addEventListener('click', () => ui.resultModal.overlay.style.display = 'none');

  initGame();

})();
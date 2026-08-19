document.addEventListener('DOMContentLoaded', () => {

  const cfgFilas = document.getElementById('cfgFilas');
  const cfgColumnas = document.getElementById('cfgColumnas');
  const cfgMinas = document.getElementById('cfgMinas');
  const btnNuevaPartida = document.getElementById('btnNuevaPartida');
  const cfgHint = document.getElementById('cfgHint');

  const minasRestantesEl = document.getElementById('minasRestantes');
  const tiempoValueEl = document.getElementById('tiempoValue');
  const estadoJuegoEl = document.getElementById('estadoJuego');
  const boardEl = document.getElementById('board');

  let filas = 8;
  let columnas = 9;
  let totalMinas = 10;
  let tablero = [];
  let primerClic = true;
  let juegoTerminado = false;
  let banderasColocadas = 0;
  let casillasReveladas = 0;
  let cronometro = null;
  let segundos = 0;

  function crearTableroVacio() {
    const t = [];
    for (let r = 0; r < filas; r++) {
      const fila = [];
      for (let c = 0; c < columnas; c++) {
        fila.push({ mina: false, revelada: false, bandera: false, numero: 0 });
      }
      t.push(fila);
    }
    return t;
  }

  function colocarMinas(filaEvitar, colEvitar) {
    let colocadas = 0;
    while (colocadas < totalMinas) {
      const r = Math.floor(Math.random() * filas);
      const c = Math.floor(Math.random() * columnas);
      const esZonaSegura = Math.abs(r - filaEvitar) <= 1 && Math.abs(c - colEvitar) <= 1;
      if (!tablero[r][c].mina && !esZonaSegura) {
        tablero[r][c].mina = true;
        colocadas++;
      }
    }
    for (let r = 0; r < filas; r++) {
      for (let c = 0; c < columnas; c++) {
        if (tablero[r][c].mina) continue;
        let contador = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < filas && nc >= 0 && nc < columnas && tablero[nr][nc].mina) {
              contador++;
            }
          }
        }
        tablero[r][c].numero = contador;
      }
    }
  }

  function iniciarPartida() {
    if (cronometro) clearInterval(cronometro);
    segundos = 0;
    tiempoValueEl.textContent = '000s';
    tablero = crearTableroVacio();
    primerClic = true;
    juegoTerminado = false;
    banderasColocadas = 0;
    casillasReveladas = 0;

    minasRestantesEl.textContent = totalMinas;
    estadoJuegoEl.textContent = 'Haz clic en una casilla para comenzar.';
    estadoJuegoEl.classList.remove('stat-value-win', 'stat-value-lose');

    renderBoard();
  }

  function iniciarCronometro() {
    cronometro = setInterval(() => {
      segundos++;
      tiempoValueEl.textContent = String(segundos).padStart(3, '0') + 's';
    }, 1000);
  }

  function revelarCelda(r, c) {
    if (r < 0 || r >= filas || c < 0 || c >= columnas) return;
    const celda = tablero[r][c];
    if (celda.revelada || celda.bandera) return;

    celda.revelada = true;
    casillasReveladas++;

    if (celda.numero === 0 && !celda.mina) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) revelarCelda(r + dr, c + dc);
        }
      }
    }
  }

  function manejarClicIzquierdo(r, c) {
    if (juegoTerminado) return;
    const celda = tablero[r][c];
    if (celda.bandera || celda.revelada) return;

    if (primerClic) {
      colocarMinas(r, c);
      primerClic = false;
      iniciarCronometro();
    }

    if (celda.mina) {
      celda.revelada = true;
      perderJuego();
      renderBoard();
      return;
    }

    revelarCelda(r, c);
    renderBoard();
    verificarVictoria();
  }

  function manejarClicDerecho(e, r, c) {
    e.preventDefault();
    if (juegoTerminado || primerClic) return;
    const celda = tablero[r][c];
    if (celda.revelada) return;

    celda.bandera = !celda.bandera;
    banderasColocadas += celda.bandera ? 1 : -1;
    minasRestantesEl.textContent = totalMinas - banderasColocadas;
    renderBoard();
  }

  function perderJuego() {
    juegoTerminado = true;
    clearInterval(cronometro);
    for (let r = 0; r < filas; r++) {
      for (let c = 0; c < columnas; c++) {
        if (tablero[r][c].mina) tablero[r][c].revelada = true;
      }
    }
    estadoJuegoEl.textContent = '💥 ¡Pisaste una mina! Fin del juego.';
    estadoJuegoEl.classList.add('stat-value-lose');
  }

  function verificarVictoria() {
    const totalCeldas = filas * columnas;
    if (casillasReveladas === totalCeldas - totalMinas) {
      juegoTerminado = true;
      clearInterval(cronometro);
      estadoJuegoEl.textContent = '🎉 ¡Ganaste! Descubriste todo el tablero.';
      estadoJuegoEl.classList.add('stat-value-win');
    }
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < filas; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';
      for (let c = 0; c < columnas; c++) {
        const celda = tablero[r][c];
        const span = document.createElement('span');

        if (celda.revelada) {
          if (celda.mina) {
            span.className = 'cell revealed mine';
            span.textContent = '💣';
          } else if (celda.numero > 0) {
            span.className = `cell revealed num-${celda.numero}`;
            span.textContent = celda.numero;
          } else {
            span.className = 'cell revealed';
          }
        } else if (celda.bandera) {
          span.className = 'cell hidden flagged';
          span.textContent = '🚩';
        } else {
          span.className = 'cell hidden';
        }

        span.addEventListener('click', () => manejarClicIzquierdo(r, c));
        span.addEventListener('contextmenu', (e) => manejarClicDerecho(e, r, c));
        rowDiv.appendChild(span);
      }
      boardEl.appendChild(rowDiv);
    }
  }

  btnNuevaPartida.addEventListener('click', () => {
    const nuevaFilas = parseInt(cfgFilas.value, 10);
    const nuevaColumnas = parseInt(cfgColumnas.value, 10);
    const nuevaMinas = parseInt(cfgMinas.value, 10);

    if (isNaN(nuevaFilas) || nuevaFilas < 5 || isNaN(nuevaColumnas) || nuevaColumnas < 5) {
      alert('Filas y columnas deben ser al menos 5.');
      return;
    }
    if (isNaN(nuevaMinas) || nuevaMinas < 1 || nuevaMinas >= nuevaFilas * nuevaColumnas) {
      alert('La cantidad de minas debe ser menor al total de casillas.');
      return;
    }

    filas = nuevaFilas;
    columnas = nuevaColumnas;
    totalMinas = nuevaMinas;

    cfgHint.textContent = '✔ Configuración guardada. Nuevo tablero listo.';
    iniciarPartida();
  });

  iniciarPartida();
});
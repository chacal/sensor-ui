(() => {
  const serverUrl = document.getElementById('server-url');
  const statusLabel = document.getElementById('status-label');
  const messageCountEl = document.getElementById('message-count');
  const tableBody = document.querySelector('#sensor-table tbody');

  let socket;
  let messageCount = 0;
  const rowsById = new Map();

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws`;
    serverUrl.textContent = url;

    setStatus('Connecting…', 'pending');

    socket = new ReconnectingWebSocket(url);

    socket.addEventListener('connecting', () => {
      setStatus('Connecting…', 'pending');
    });

    socket.addEventListener('open', () => {
      setStatus('Connected', 'connected');
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (!payload || !payload.instance) {
          return;
        }

        messageCount += 1;
        messageCountEl.textContent = `${messageCount} msgs`;

        upsertRow(payload);
      } catch (err) {
        // Ignore non-JSON payloads.
      }
    });

    socket.addEventListener('close', () => {
      setStatus('Disconnected (retrying…)');
    });

    socket.addEventListener('error', () => {
      setStatus('Connection error (retrying…)');
    });
  }

  function upsertRow(payload) {
    const id = payload.instance;
    const temp = safeNumber(payload.temperature);
    const humidity = safeNumber(payload.humidity);
    const pressure = safeNumber(payload.pressure);
    const vccMv = safeNumber(payload.vcc);
    const voltage = vccMv === null ? null : vccMv / 1000;
    const ts = payload.ts || payload.timestamp || Date.now();

    let row = rowsById.get(id);
    if (!row) {
      row = document.createElement('tr');
      row.appendChild(document.createElement('td')); // id
      row.appendChild(document.createElement('td')); // temp
      row.appendChild(document.createElement('td')); // humidity
      row.appendChild(document.createElement('td')); // pressure
      row.appendChild(document.createElement('td')); // vcc
      row.appendChild(document.createElement('td')); // time
      tableBody.appendChild(row);

      rowsById.set(id, row);
    }

    const cells = row.children;
    cells[0].textContent = id;
    cells[1].textContent = formatValue(temp, '°C');
    cells[2].textContent = formatValue(humidity, '%');
    cells[3].textContent = formatValue(pressure, 'hPa');
    cells[4].textContent = formatVoltage(vccMv);
    cells[5].textContent = formatTime(ts);

    const isLowVcc = voltage !== null && voltage < 2.6;
    row.classList.toggle('low-vcc', isLowVcc);

    sortRows();
  }

  function setStatus(label, state = 'disconnected') {
    statusLabel.textContent = label;
    statusLabel.classList.toggle('ok', state === 'connected');
  }

  function sortRows() {
    const rows = Array.from(tableBody.children);
    rows.sort((a, b) => a.children[0].textContent.localeCompare(b.children[0].textContent));
    rows.forEach((row) => tableBody.appendChild(row));
  }

  function safeNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function formatValue(value, suffix) {
    if (value === null || value === undefined) return '—';
    return suffix ? `${value} ${suffix}` : String(value);
  }

  function formatVoltage(millivolts) {
    if (millivolts === null || millivolts === undefined) return '—';
    return `${(millivolts / 1000).toFixed(2)} V`;
  }

  function formatTime(ts) {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  connect();
})();

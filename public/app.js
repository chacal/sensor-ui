(() => {
  const statusEl = document.getElementById('status');
  const statusText = statusEl.querySelector('.status-text');
  const statusDot = statusEl.querySelector('.status-dot');
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
    const jsonText = JSON.stringify(payload);

    let row = rowsById.get(id);
    if (!row) {
      row = document.createElement('tr');
      const idCell = document.createElement('td');
      const payloadCell = document.createElement('td');

      idCell.textContent = id;
      payloadCell.className = 'payload-cell';
      payloadCell.textContent = jsonText;

      row.appendChild(idCell);
      row.appendChild(payloadCell);
      tableBody.appendChild(row);

      rowsById.set(id, row);
    } else {
      row.children[0].textContent = id;
      row.children[1].textContent = jsonText;
    }
  }

  function setStatus(label, state = 'disconnected') {
    statusText.textContent = label;
    statusLabel.textContent = label;

    statusEl.classList.toggle('connected', state === 'connected');
    statusDot.style.background = state === 'connected' ? '#34d399' : '#ef4444';
  }

  connect();
})();

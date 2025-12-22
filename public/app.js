(() => {
  const statusEl = document.getElementById('status');
  const statusText = statusEl.querySelector('.status-text');
  const statusDot = statusEl.querySelector('.status-dot');
  const log = document.getElementById('log');
  const serverUrl = document.getElementById('server-url');
  const statusLabel = document.getElementById('status-label');
  const messageCountEl = document.getElementById('message-count');

  let socket;
  let messageCount = 0;

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

        messageCount += 1;
        messageCountEl.textContent = String(messageCount);

        const time = new Date(payload.ts || Date.now()).toLocaleTimeString();
        const details = `RSSI ${payload.rssi || ''} · ${time}`;
        const text = payload.instance || event.data;
        addMessage(text, details);
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

  function addMessage(text, details = '') {
    const el = document.createElement('div');
    el.className = `msg`;
    el.textContent = text;

    if (details) {
      const small = document.createElement('small');
      small.textContent = details;
      el.appendChild(small);
    }

    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function setStatus(label, state = 'disconnected') {
    statusText.textContent = label;
    statusLabel.textContent = label;

    statusEl.classList.remove('connected');
    statusDot.style.background = state === 'connected' ? '#34d399' : '#ef4444';
  }

  connect();
})();

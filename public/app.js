(() => {
  const statusEl = document.getElementById('status');
  const statusText = statusEl.querySelector('.status-text');
  const statusDot = statusEl.querySelector('.status-dot');
  const log = document.getElementById('log');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
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
      messageCount += 1;
      messageCountEl.textContent = String(messageCount);

      try {
        const payload = JSON.parse(event.data);
        const details =
          payload.type === 'system'
            ? 'System'
            : `${payload.from || 'Server'} · ${new Date(payload.timestamp || Date.now()).toLocaleTimeString()}`;
        addMessage(payload.message, payload.type === 'system', details);
      } catch (err) {
        addMessage(event.data);
      }
    });

    socket.addEventListener('close', () => {
      setStatus('Disconnected (retrying…)');
    });

    socket.addEventListener('error', () => {
      setStatus('Connection error (retrying…)');
    });
  }

  function addMessage(text, isSystem = false, details = '') {
    const el = document.createElement('div');
    el.className = `msg${isSystem ? ' system' : ''}`;
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

    const disabled = state !== 'connected';
    messageInput.disabled = disabled;
    sendBtn.disabled = disabled;
  }

  messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(text);
    messageInput.value = '';
    messageInput.focus();
  });

  connect();
})();

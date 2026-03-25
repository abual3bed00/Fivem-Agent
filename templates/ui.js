// ═══════════════════════════════════════════════════════════════════════════
//  FiveM NUI JavaScript Template
// ═══════════════════════════════════════════════════════════════════════════

const app = document.getElementById('app');

// Listen for messages from Lua client
window.addEventListener('message', (event) => {
  const data = event.data;

  switch (data.action) {
    case 'open':
      app.classList.remove('hidden');
      // Populate UI with data
      break;

    case 'close':
      closeUI();
      break;

    case 'update':
      // Update UI data
      break;
  }
});

// Close UI and notify Lua
function closeUI() {
  app.classList.add('hidden');
  fetch(`https://${GetParentResourceName()}/closeUI`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

// Do an action and notify Lua
function doAction() {
  fetch(`https://${GetParentResourceName()}/doAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'example' }),
  });
}

// ESC key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUI();
});

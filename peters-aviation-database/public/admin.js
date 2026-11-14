document.getElementById('login-button').addEventListener('click', () => {
  const password = document.getElementById('password-input').value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('add-form-section').classList.remove('hidden');
      } else {
        document.getElementById('login-error').classList.remove('hidden');
      }
    });
});
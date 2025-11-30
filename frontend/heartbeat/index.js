
// Site listeners /////////////////////////////////////////////////////////////////

// Heartbeat button
document.getElementById('button-test').addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        const res = await fetch('/api/heartbeat');
        const data = await res.json();
        document.getElementById('textarea-response').textContent = JSON.stringify(data, null, 4);
    } catch (err) {
        document.getElementById('textarea-response').textContent = 'Error al consultar API.';
    }
});

// Reset button
document.getElementById('button-reset').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('textarea-response').textContent = "";
});

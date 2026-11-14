const express = require('express');
const app = express();
const PORT = 1114;

app.get('/', (req, res) => {
    res.send('Welcome to Peters Aviation Database!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
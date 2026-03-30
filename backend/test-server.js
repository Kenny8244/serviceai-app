const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is working!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});








process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_prueba';

const express = require('express');
const path = require('path'); 
const app = express();
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cambia esta línea:
app.use(express.static(path.join(__dirname, 'view'))); // Ahora sirve archivos desde /backend/view

app.use('/api/', productRoutes);
app.use('/api/', authRoutes);
app.use('/api/', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


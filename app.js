process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_prueba';

const express = require('express');
const path = require('path'); 
const app = express();
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
//const orderRoutes = require('./routes/orderRoutes');
const middleware = require('./middleware/authMiddleware');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend', 'pages')));

app.use('/api/', productRoutes);
app.use('/api/', authRoutes);
app.use('/api/', userRoutes);
//app.use('/api/', orderRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


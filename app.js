process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_prueba';

const cors = require('cors');
const express = require('express');
const path = require('path'); 
const app = express();
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const middleware = require('./middleware/authMiddleware');
const multer = require('multer');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend'))); // Serve static files from the frontend directory

app.use('/api/', productRoutes);
app.use('/api/', authRoutes);
app.use('/api/', userRoutes);
app.use('/api/', cartRoutes);
app.use('/api/', orderRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


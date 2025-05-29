// app.js
const express = require('express');
const posts = require('./posts');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Blog Posts' });
});

// GET - Obtener todos los posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// POST - Crear un nuevo post
app.post('/api/posts', (req, res) => {
  const { title, content, author } = req.body;
  
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const newPost = {
    id: posts.length + 1,
    title,
    content,
    author,
    date: new Date()
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

// DELETE - Eliminar un post por ID
app.delete('/api/posts/', (req, res) => {
  const id = parseInt(req.params.id);
  const index = posts.findIndex(post => post.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Publicación no encontrada' });
  }

  posts.splice(index, 1);
  res.status(204).send();
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
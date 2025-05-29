// index.js

// Configura variables de entorno
require('dotenv').config({ silent: true });

// Importa dependencias
const express = require('express');
const db = require('./models');

// Importar dependencias de autenticación
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const jwt           = require('jsonwebtoken');
const bcrypt        = require('bcryptjs');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

/* ───── 2. Estrategia Local (login) ───── */
passport.use('local',
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
          return done(null, false, { message: 'Usuario no existe' });
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
        return done(null, user); // autenticado
      } catch (err) { return done(err); }
    }
  )
);

// Middleware para parsear JSON
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Blog Posts' });
});

// GET - Obtener todos los posts
app.get('/api/posts', async (req, res) => {
  const posts = await db.Post.findAll();
  res.json(posts);
});

// POST - Crear un nuevo post
app.post('/api/posts/:id', async (req, res) => {
  const { title, content} = req.body;
  const  authorId  = req.params.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const post = await db.Post.create({
    title,content,authorId
  })

  res.status(201).json(post)
});

app.post('/api/authors', async (req, res) => {
  console.log(req.body);
  const name = req.body?.name

  if (!name) {
    return res.status(400).json({ error: 'El nombre del autor es requerido' })
  }

  const author = await db.Author.create({
    name
  })

  res.status(201).json(author)
})

app.get('/api/authors', async (req, res) => {
  const authors = await db.Author.findAll()
  res.json(authors)
})

app.get('/api/authors/:id', async (req, res) => {
  const { id } = req.params

  const author = await db.Author.findByPk(id)

  if (!author) {
    return res.status(404).json({ error: 'Autor no encontrado' })
  }

  res.json(author)
})

app.patch('/api/authors/:id', async (req, res) => {
  const { id } = req.params
  const name = req.body?.name
  const email = req.body?.email

  const author = await db.Author.findByPk(id)

  if (!author) {
    return res.status(404).json({ error: 'Autor no encontrado' })
  }

  author.name = name
  author.email = email

  
  await author.save()

  res.json(author)
})

/** Registro */
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await db.User.create({ name, email, password: hash });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Login → genera token */
app.post('/api/login',
  passport.authenticate('local', { session: false }),
  (req, res) => {
    const payload = { id: req.user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, token_type: 'Bearer' });
  }
);

/* ───── 3. Estrategia JWT (protección) ───── */
passport.use('jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      session: false
    },
    async (payload, done) => {
      try {
        const user = await db.User.findByPk(payload.id);
        if (!user)   return done(null, false);
        return done(null, user);
      } catch (err) { return done(err, false); }
    }
  )
);

/** Ruta protegida */
app.get('/api/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // `req.user` viene de la estrategia JWT
    res.json({ id: req.user.id, email: req.user.email, msg: 'Acceso concedido 👋' });
  }
);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
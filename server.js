const express = require('express');
const mysql = require('mysql');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos usando variables de entorno
const db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'Score'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos');
});

// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Middleware para manejar datos en formato JSON
app.use(express.json());

// Ruta para obtener las puntuaciones
app.get('/api/scores', (req, res) => {
    const query = 'SELECT * FROM score ORDER BY puntos DESC, tiempo ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener las puntuaciones:', err);
            res.status(500).json({ error: 'Error al obtener las puntuaciones' });
        } else {
            // Formatear la fecha
            const formattedResults = results.map(result => {
                return {
                    ...result,
                    fecha: new Date(result.fecha).toISOString().split('T')[0] // Formatear como YYYY-MM-DD
                };
            });
            res.status(200).json(formattedResults);
        }
    });
});

// Guardar una nueva puntuación
app.post('/api/scores', (req, res) => {
    const { nombre, tiempo, puntos } = req.body;
    const fecha = new Date().toISOString().split('T')[0]; // Obtener fecha actual en formato YYYY-MM-DD
    // Verificar que todos los datos necesarios estén presentes
    if (!nombre || !tiempo || !puntos) {
        return res.status(400).json({ error: 'Nombre, tiempo y puntos son requeridos' });
    }
    // Consulta SQL para insertar los datos
    const query = 'INSERT INTO score (nombre, tiempo, puntos, fecha) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, tiempo, puntos, fecha], (err, results) => {
        if (err) {
            console.error('Error al guardar la puntuación:', err);
            res.status(500).json({ error: 'Error al guardar la puntuación' });
        } else {
            res.status(201).json({ message: 'Puntuación guardada con éxito' });
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

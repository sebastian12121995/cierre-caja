const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configuración de multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/send-email', upload.single('pdf'), (req, res) => {
    const pdfBuffer = req.file.buffer;

    // Configuración del transporte de Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'cierresdecaja993@gmail.com', // Reemplaza con tu correo
            pass: 'ayno vblp ipen ryee'   // Reemplaza con tu contraseña
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'cierresdecaja993@gmail.com', // Reemplaza con el correo del destinatario
        subject: 'Reporte de Cierre de Caja',
        text: 'Adjunto encontrarás el reporte de cierre de caja.',
        attachments: [
            {
                filename: 'reporte-cierre-caja.pdf',
                content: pdfBuffer
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo:', error);
            res.status(500).send('Error al enviar el correo');
        } else {
            console.log('Correo enviado:', info.response);
            res.status(200).send('Correo enviado');
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/consulta/:dni', async (req, res) => {
    const dni = req.params.dni;
    const url = `http://wsminsa.minsa.gob.pe/WSRENIEC_DNI/SerDNI.asmx/GetReniec?strDNIAuto=${dni}&strDNICon=${dni}`;

    try {
        const response = await axios.get(url);
        const xmlResponse = response.data;

        // Imprimir la respuesta cruda
        /*console.log('Respuesta XML cruda:', xmlResponse);*/

        // Parsear el XML usando xml2js
        xml2js.parseString(xmlResponse, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('Error al parsear el XML:', err);
                return res.status(500).json({ error: 'Error al parsear el XML' });
            }

            // Verificar la estructura de la respuesta
            console.log('Resultado del parseo:', result);

            // Asegurarse de que la respuesta tenga la estructura esperada
            if (!result['ArrayOfString'] || !result['ArrayOfString']['string']) {
                console.error('Estructura de respuesta inesperada:', result);
                return res.status(404).json({ error: 'Datos no encontrados' });
            }

            const strings = result['ArrayOfString']['string'];

            // Verificar que hay suficientes elementos en el array
            if (strings.length < 18) {
                console.error('Datos no encontrados en la respuesta:', result);
                return res.status(404).json({ error: 'Datos no encontrados' });
            }

            // Asignar los valores de acuerdo a la nueva estructura
            const nom = strings[3]; // Nombres
            const apePat = strings[1]; // Apellido Paterno
            const apeMat = strings[2]; // Apellido Materno
            const sexo = strings[17]; // Sexo

            res.json({
                nom,
                apePat,
                apeMat,
                sexo: sexo === "1" ? "Masculino" : "Femenino",
                //xml: xmlResponse // Agregar el XML original a la respuesta
            });
        });
    } catch (error) {
        console.error('Error al obtener datos del DNI:', error);
        res.status(500).json({ error: 'Error al obtener datos del DNI' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
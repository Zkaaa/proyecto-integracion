var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

//Conexion a postgress
const { Pool, Client } = require('pg')

// Credenciales BD Remota
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'core-sunat',
    password: 'postgres',
    port: 5432,
})

var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')));
app.use('', express.static(path.join(__dirname, './angular')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.post('/api/registrarFactura', async(req, res) => {

    console.log(req.body)

    let query = `INSERT INTO public.tp_factura(id_tp_factura, idfactura, "tipoComp", "codEstablecimiento", "numeroSerie", 
        "tipoDoc", "numeroDoc", "nombrePer","direccionPer", igv, total, estado, "fechaRegistro")
        VALUES ( nextval('seq_facturas'), $1, $2, $3, $4, $5, $6, $7 , $8, $9, $10, $11, $12) RETURNING id_tp_factura`

    let idFactura = `B${req.body.numeroSerie}${req.body.codEstablecimiento}`

    let values = [
        idFactura, req.body.tipoComp, req.body.codEstablecimiento, req.body.numeroSerie, req.body.tipoDoc, req.body.numeroDoc,
        req.body.nombrePer, req.body.direccionPer, req.body.igv, req.body.total, req.body.estado,
        req.body.fechaRegistro
    ]

    pool.query(query, values, (err, factura) => {
        if (err) {
            return res.status(200).json({
                ok: false,
                msg: 'Error al generar una factura.'
            })
        } else {
            let queryProd = `INSERT INTO public.ts_factura_detalle(
                id_tp_factura, id_producto, nom_producto, cant_producto, precio_producto)
                VALUES`
            for (let i = 0; i < req.body.items.length; i++) {
                let producto = req.body.items[i];
                queryProd = queryProd + `(${factura.rows[0].id_tp_factura}, '${producto.codItem}', '${producto.descripcionItem}', ${producto.cantidadItem}, ${producto.precioItem}),`
            }
            queryProd = queryProd.slice(0, -1)
            pool.query(queryProd, (err, item) => {
                if (err) {
                    return res.status(401).json({
                        ok: false,
                        msg: 'Error al registrar la factura',
                    });
                } else {
                    return res.status(200).json({
                        ok: true,
                        msg: 'Se ingresó correctamente la factura'
                    })
                }
            })
        }
    });
});

app.get('/api/registrarFactura', function(req, res) {
    return res.status(200).json({
        ok: false,
        data: "No se eencuentra al trabajador en la BD",
        error: 406
    })
});


app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});
<?php

$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';      // Ejemplo: mysql-maria123.alwaysdata.net
$user = '415850_donovan';                           // Usuario de la base de datos
$password = '19Mi77do21ri';                   // Contraseña de la base de datos
$database = 'hotelesresidenciadelbien_db';               // Nombre exacto de tu base de datos

// Crear conexión
$conexion = new mysqli($host, $user, $password, $database);

// Verificar conexión
if ($conexion->connect_error) {
    die("Conexión fallida: " . $conexion->connect_error);
}

// Consultar datos
$sql = "SELECT * FROM hoteles";
$resultado = $conexion->query($sql);

$datos = [];

if ($resultado->num_rows > 0) {
    while ($fila = $resultado->fetch_assoc()) {
        $datos[] = $fila;
    }
}

// Devolver como JSON
header('Content-Type: application/json');
echo json_encode($datos);
?>

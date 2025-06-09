<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Credenciales de la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);

// Verificar la conexión a la base de datos.
if ($conexion->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conexion->connect_error]));
}

// Consultar todos los datos de la tabla 'hoteles'.
$sql = "SELECT * FROM hoteles";
$resultado = $conexion->query($sql);

$datos = [];

// Recorrer los resultados y almacenarlos en un array.
if ($resultado->num_rows > 0) {
    while ($fila = $resultado->fetch_assoc()) {
        $datos[] = $fila;
    }
}

// Devolver los datos como JSON.
echo json_encode($datos);

$conexion->close();
?>
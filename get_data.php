<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

// Crear conexión
$conexion = new mysqli($host, $user, $password, $database);

// Verificar conexión
if ($conexion->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conexion->connect_error]));
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
echo json_encode($datos);

// Cerrar conexión
$conexion->close();
?>
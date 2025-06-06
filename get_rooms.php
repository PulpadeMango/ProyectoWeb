<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Considera restringir esto en producción
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

// Inicializar la consulta SQL
$sql = "SELECT * FROM Habitacion";
$params = [];
$types = '';

// Verificar si se proporciona un id_hotel para filtrar
if (isset($_GET['id_hotel']) && is_numeric($_GET['id_hotel'])) {
    $sql .= " WHERE id_hotel = ?";
    $params[] = $_GET['id_hotel'];
    $types .= 'i'; // 'i' para entero
}

// Preparar y ejecutar la consulta
$stmt = $conexion->prepare($sql);

if ($stmt) {
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $resultado = $stmt->get_result();

    $datos = [];
    if ($resultado->num_rows > 0) {
        while ($fila = $resultado->fetch_assoc()) {
            $datos[] = $fila;
        }
    }
    echo json_encode($datos);
    $stmt->close();
} else {
    echo json_encode(["error" => "Error al preparar la consulta: " . $conexion->error]);
}

// Cerrar conexión
$conexion->close();
?>
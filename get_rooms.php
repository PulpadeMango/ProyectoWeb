<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Credenciales y conexión a la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);

// Verificar la conexión a la base de datos.
if ($conexion->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conexion->connect_error]));
}

// Inicializar la consulta SQL para obtener todas las habitaciones.
$sql = "SELECT * FROM Habitacion";
$params = [];
$types = '';

// Si se proporciona un ID de hotel, se añade un filtro a la consulta.
if (isset($_GET['id_hotel']) && is_numeric($_GET['id_hotel'])) {
    $sql .= " WHERE id_hotel = ?";
    $params[] = $_GET['id_hotel'];
    $types .= 'i'; // 'i' para indicar un parámetro entero.
}

// Preparar y ejecutar la consulta.
$stmt = $conexion->prepare($sql);

if ($stmt) {
    // Si hay parámetros, vincularlos a la consulta preparada.
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $resultado = $stmt->get_result();

    $datos = [];
    // Recorrer los resultados y almacenarlos en un array.
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

$conexion->close();
?>
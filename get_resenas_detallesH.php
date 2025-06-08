<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- Conexión a la base de datos ---
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

// --- Obtener parámetros ---
$id_hotel = $_GET['id'] ?? null;
$tabla = $_GET['tabla'] ?? 'hoteles';
$tabla = in_array($tabla, ['hoteles', 'hoteles_del_mal']) ? $tabla : 'hoteles';

if (!$id_hotel) {
    echo json_encode(["success" => false, "message" => "ID de hotel no proporcionado."]);
    exit();
}

// --- Consultar detalles del hotel ---
$stmt_hotel = $conexion->prepare("SELECT id, nombre, imagen_url, descripcion, descripcion_detallada, servicios FROM $tabla WHERE id = ?");
$stmt_hotel->bind_param("i", $id_hotel);
$stmt_hotel->execute();
$result_hotel = $stmt_hotel->get_result();

if ($result_hotel->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Hotel no encontrado."]);
    $stmt_hotel->close();
    $conexion->close();
    exit();
}

$hotel = $result_hotel->fetch_assoc();
$stmt_hotel->close();

// Ajustar los campos como espera el JS
$hotel['id_hotel'] = $hotel['id'];
$hotel['descripcion_corta'] = $hotel['descripcion'];
$hotel['servicios'] = $hotel['servicios'] ? explode(',', $hotel['servicios']) : [];

unset($hotel['id']);
unset($hotel['descripcion']);

$reviews = [];

// --- Consultar reseñas ---
$stmt_reviews = $conexion->prepare("
    SELECT r.calificacion, r.comentario, r.fecha_reseña, u.nombre AS nombre_usuario
    FROM Reseña r
    JOIN usuarios u ON r.id_usuario = u.id_usuario
    WHERE r.id_hotel = ?
    ORDER BY r.fecha_reseña DESC
");
$stmt_reviews->bind_param("i", $id_hotel);
$stmt_reviews->execute();
$result_reviews = $stmt_reviews->get_result();

while ($row = $result_reviews->fetch_assoc()) {
    $reviews[] = $row;
}
$stmt_reviews->close();
$conexion->close();

// --- Respuesta JSON ---
echo json_encode([
    "success" => true,
    "hotel" => $hotel,
    "reviews" => $reviews
]);

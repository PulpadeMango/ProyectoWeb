<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Credenciales y conexión a la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

// Obtener ID del hotel y tabla (hoteles por defecto) de los parámetros GET.
$id_hotel = $_GET['id'] ?? null;
$tabla = $_GET['tabla'] ?? 'hoteles';
// Validar que la tabla sea 'hoteles' o 'hoteles_del_mal' para evitar inyección SQL.
$tabla = in_array($tabla, ['hoteles', 'hoteles_del_mal']) ? $tabla : 'hoteles';

if (!$id_hotel) {
    echo json_encode(["success" => false, "message" => "ID de hotel no proporcionado."]);
    exit();
}

// Consultar los detalles del hotel de la tabla especificada.
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

// Ajustar los nombres de los campos del hotel para consistencia con el frontend.
$hotel['id_hotel'] = $hotel['id'];
$hotel['descripcion_corta'] = $hotel['descripcion'];
$hotel['servicios'] = $hotel['servicios'] ? explode(',', $hotel['servicios']) : [];

// Eliminar campos originales que no se usarán directamente en la respuesta.
unset($hotel['id']);
unset($hotel['descripcion']);

$reviews = [];

// Consultar las reseñas asociadas a este hotel, incluyendo el nombre del usuario.
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

// Devolver los detalles del hotel y sus reseñas en formato JSON.
echo json_encode([
    "success" => true,
    "hotel" => $hotel,
    "reviews" => $reviews
]);
?>
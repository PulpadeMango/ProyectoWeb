<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Considera restringir esto en producción
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Datos de conexión
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

$id_hotel = $_GET['id'] ?? null;

if (!$id_hotel) {
    echo json_encode(["success" => false, "message" => "ID de hotel no proporcionado."]);
    exit();
}

$hotel_details = [];
$reviews = [];

// --- Obtener detalles del hotel (Ajustado a tus campos de Hoteles) ---
// La tabla 'hoteles' se mantiene en minúsculas, como confirmamos.
$stmt_hotel = $conexion->prepare("SELECT id, nombre, imagen_url, descripcion, descripcion_detallada, servicios FROM hoteles WHERE id = ?");
$stmt_hotel->bind_param("i", $id_hotel);
$stmt_hotel->execute();
$result_hotel = $stmt_hotel->get_result();

if ($result_hotel->num_rows > 0) {
    $hotel_details = $result_hotel->fetch_assoc();
    // Renombrar campos para que coincidan con el JS esperado
    $hotel_details['id_hotel'] = $hotel_details['id']; // Asegura que el JS tenga id_hotel
    $hotel_details['descripcion_corta'] = $hotel_details['descripcion']; // JS espera descripcion_corta

    // Los servicios se almacenan como cadena separada por comas, conviértela a array
    $hotel_details['servicios'] = $hotel_details['servicios'] ? explode(',', $hotel_details['servicios']) : [];

    // Eliminar campos originales si no los necesitas en el JSON final para el frontend
    unset($hotel_details['id']);
    unset($hotel_details['descripcion']);

} else {
    echo json_encode(["success" => false, "message" => "Hotel no encontrado."]);
    $stmt_hotel->close();
    $conexion->close();
    exit();
}
$stmt_hotel->close();

// --- Obtener reseñas del hotel (Ajustado a tus campos de Reseña y Usuarios) ---
// Asegúrate de que tu tabla Reseña tiene el campo 'calificacion' y 'fecha_reseña'
$stmt_reviews = $conexion->prepare("
    SELECT
        r.calificacion,
        r.comentario,
        r.fecha_reseña,
        u.nombre AS nombre_usuario
    FROM Reseña r
    JOIN usuarios u ON r.id_usuario = u.id_usuario  -- ¡CORRECCIÓN AQUÍ: 'Usuarios' cambiado a 'usuarios'!
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

echo json_encode([
    "success" => true,
    "hotel" => $hotel_details,
    "reviews" => $reviews
]);
?>
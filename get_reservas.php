<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Considera restringir esto en producción
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Datos de conexión
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri'; // Tu contraseña de la base de datos
$database = 'hotelesresidenciadelbien_db';

// Crear conexión
$conexion = new mysqli($host, $user, $password, $database);

// Verificar conexión
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

// 1. Verificar si el usuario está autenticado en la sesión (hotel.js ya hace esto, pero es una doble verificación de seguridad)
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Usuario no autenticado en el servidor.", "hasCompletedReservation" => false]);
    exit();
}

$id_usuario = $_SESSION['id_usuario']; // Obtener id_usuario de la sesión
$id_hotel = $_GET['id_hotel'] ?? null;

if (!$id_hotel || !is_numeric($id_hotel)) {
    echo json_encode(["success" => false, "message" => "ID de hotel no proporcionado o inválido.", "hasCompletedReservation" => false]);
    exit();
}

// 2. Consulta para verificar si el usuario tiene una reserva "Completada" para este hotel.
// Necesitamos unir la tabla 'Reserva' con 'Habitacion' para acceder a 'id_hotel'.
$sql = "
SELECT COUNT(R.id_reserva) AS num_completed_reservations
FROM Reserva R
JOIN Habitacion H ON R.id_habitacion = H.id_habitacion
WHERE R.id_usuario = ? 
  AND H.id_hotel = ? 
  AND R.estado = 'Completada'
";

$stmt = $conexion->prepare($sql);

if ($stmt) {
    $stmt->bind_param("ii", $id_usuario, $id_hotel); // 'ii' para dos enteros (id_usuario, id_hotel)
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $num_completed_reservations = $row['num_completed_reservations'];

    $stmt->close();
    $conexion->close();

    echo json_encode([
        "success" => true,
        "message" => "Verificación de reserva completada.",
        "hasCompletedReservation" => ($num_completed_reservations > 0)
    ]);
} else {
    // Esto es un error de preparación de la consulta SQL
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar la consulta SQL: " . $conexion->error,
        "hasCompletedReservation" => false
    ]);
}
?>
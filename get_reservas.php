<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar solicitudes OPTIONS (preflight CORS).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Credenciales y conexión a la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);

// Verificar la conexión a la base de datos.
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

// Asegurarse de que el usuario esté autenticado.
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Usuario no autenticado en el servidor.", "hasCompletedReservation" => false]);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];
$id_hotel = $_GET['id_hotel'] ?? null;

// Validar que el ID del hotel esté presente y sea numérico.
if (!$id_hotel || !is_numeric($id_hotel)) {
    echo json_encode(["success" => false, "message" => "ID de hotel no proporcionado o inválido.", "hasCompletedReservation" => false]);
    exit();
}

// Consulta para verificar si el usuario tiene una reserva "Completada" para el hotel dado.
// Se une la tabla `Reserva` con `Habitacion` para filtrar por `id_hotel`.
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
    $stmt->bind_param("ii", $id_usuario, $id_hotel);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $num_completed_reservations = $row['num_completed_reservations'];

    $stmt->close();
    $conexion->close();

    // Devolver si el usuario tiene reservas completadas para el hotel.
    echo json_encode([
        "success" => true,
        "message" => "Verificación de reserva completada.",
        "hasCompletedReservation" => ($num_completed_reservations > 0)
    ]);
} else {
    // Manejo de errores si la preparación de la consulta falla.
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar la consulta SQL: " . $conexion->error,
        "hasCompletedReservation" => false
    ]);
}
?>
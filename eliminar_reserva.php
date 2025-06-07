<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0); // CORS preflight
}

// Verificar si el usuario está autenticado
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión."]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

// Leer datos del cuerpo JSON
$input = json_decode(file_get_contents("php://input"), true);
$id_reserva = $input['id_reserva'] ?? null;

if (!$id_reserva) {
    echo json_encode(["success" => false, "message" => "ID de reserva no proporcionado."]);
    exit;
}

// Conexión
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $conexion->connect_error]);
    exit;
}

// Eliminar solo si la reserva pertenece al usuario y está cancelada
$sql = "DELETE FROM Reserva WHERE id_reserva = ? AND id_usuario = ? AND estado = 'Cancelada'";
$stmt = $conexion->prepare($sql);

if ($stmt) {
    $stmt->bind_param("ii", $id_reserva, $id_usuario);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Reserva eliminada."]);
    } else {
        echo json_encode(["success" => false, "message" => "La reserva no se puede eliminar (verifica si está cancelada o si te pertenece)."]);
    }

    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Error en la consulta: " . $conexion->error]);
}

$conexion->close();
?>

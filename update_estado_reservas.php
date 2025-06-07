<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight de CORS
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

// Verificar sesión activa
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Usuario no autenticado."]);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];

// Leer datos POST
$input = json_decode(file_get_contents("php://input"), true);
$id_reserva = $input['id_reserva'] ?? null;
$nuevo_estado = $input['estado'] ?? null;

// Validar entrada
$estados_validos = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'];

if (!$id_reserva || !$nuevo_estado || !in_array($nuevo_estado, $estados_validos)) {
    echo json_encode(["success" => false, "message" => "Datos inválidos o incompletos."]);
    exit();
}

// Verificar que la reserva pertenece al usuario actual
$consulta = $conexion->prepare("SELECT id_reserva FROM Reserva WHERE id_reserva = ? AND id_usuario = ?");
$consulta->bind_param("ii", $id_reserva, $id_usuario);
$consulta->execute();
$resultado = $consulta->get_result();

if ($resultado->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Reserva no encontrada o no te pertenece."]);
    exit();
}
$consulta->close();

// Actualizar estado
$update = $conexion->prepare("UPDATE Reserva SET estado = ? WHERE id_reserva = ?");
$update->bind_param("si", $nuevo_estado, $id_reserva);

if ($update->execute()) {
    echo json_encode(["success" => true, "message" => "Estado actualizado a '$nuevo_estado'."]);
} else {
    echo json_encode(["success" => false, "message" => "Error al actualizar el estado."]);
}

$update->close();
$conexion->close();
?>

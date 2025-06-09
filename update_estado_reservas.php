<?php
session_start(); // Inicia la sesión para acceder a la información del usuario.

// Configura las cabeceras HTTP para permitir solicitudes CORS (Cross-Origin Resource Sharing)
// Esto es necesario si la solicitud proviene de un dominio diferente al del servidor.
header('Content-Type: application/json'); // Indica que la respuesta será en formato JSON.
header('Access-Control-Allow-Origin: *'); // Permite solicitudes desde cualquier origen.
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Define los métodos HTTP permitidos.
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // Define las cabeceras permitidas.

// Manejar la solicitud OPTIONS (preflight request de CORS).
// Los navegadores envían una solicitud OPTIONS antes de la solicitud real (POST, GET, etc.)
// para verificar los permisos de CORS. Si es una OPTIONS, simplemente sale.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Datos de conexión a la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

// Establece la conexión con la base de datos.
$conexion = new mysqli($host, $user, $password, $database);
// Verifica si la conexión falló y envía una respuesta JSON con el error.
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida: " . $conexion->connect_error]);
    exit();
}

// Verificar si el usuario ha iniciado sesión.
// Si no hay 'id_usuario' en la sesión, el usuario no está autenticado.
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Usuario no autenticado."]);
    exit();
}

$id_usuario = $_SESSION['id_usuario']; // Obtiene el ID del usuario de la sesión.

// Lee los datos JSON enviados en el cuerpo de la solicitud POST.
$input = json_decode(file_get_contents("php://input"), true);
$id_reserva = $input['id_reserva'] ?? null; // Obtiene el ID de la reserva.
$nuevo_estado = $input['estado'] ?? null; // Obtiene el nuevo estado.

// Define los estados válidos permitidos para una reserva.
$estados_validos = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'];

// Valida que los datos de entrada no sean nulos y que el nuevo estado sea válido.
if (!$id_reserva || !$nuevo_estado || !in_array($nuevo_estado, $estados_validos)) {
    echo json_encode(["success" => false, "message" => "Datos inválidos o incompletos."]);
    exit();
}

// Verifica que la reserva pertenezca al usuario actual antes de intentar actualizarla.
$consulta = $conexion->prepare("SELECT id_reserva FROM Reserva WHERE id_reserva = ? AND id_usuario = ?");
$consulta->bind_param("ii", $id_reserva, $id_usuario);
$consulta->execute();
$resultado = $consulta->get_result();

// Si la reserva no existe o no pertenece al usuario, envía un error.
if ($resultado->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Reserva no encontrada o no te pertenece."]);
    exit();
}
$consulta->close(); // Cierra la declaración de verificación.

// Prepara la consulta para actualizar el estado de la reserva.
$update = $conexion->prepare("UPDATE Reserva SET estado = ? WHERE id_reserva = ?");
$update->bind_param("si", $nuevo_estado, $id_reserva);

// Ejecuta la actualización y envía una respuesta JSON.
if ($update->execute()) {
    echo json_encode(["success" => true, "message" => "Estado actualizado a '$nuevo_estado'."]);
} else {
    echo json_encode(["success" => false, "message" => "Error al actualizar el estado."]);
}

$update->close(); // Cierra la declaración de actualización.
$conexion->close(); // Cierra la conexión a la base de datos.
?>
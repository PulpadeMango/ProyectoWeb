<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar solicitudes OPTIONS (preflight CORS).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Credenciales de la base de datos.
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
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión para realizar una reserva."]);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];

// Obtener los datos JSON del cuerpo de la solicitud POST.
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$id_habitacion = $data['id_habitacion'] ?? null;
$fecha_inicio = $data['fecha_inicio'] ?? null;
$fecha_fin = $data['fecha_fin'] ?? null;

// Validar que todos los datos requeridos para la reserva estén presentes.
if (empty($id_habitacion) || empty($fecha_inicio) || empty($fecha_fin)) {
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos para la reserva."]);
    exit();
}

// Validar el formato de las fechas (YYYY-MM-DD).
if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $fecha_inicio) || !preg_match("/^\d{4}-\d{2}-\d{2}$/", $fecha_fin)) {
    echo json_encode(["success" => false, "message" => "Formato de fecha inválido. Usa YYYY-MM-DD."]);
    exit();
}

// Convertir fechas a objetos DateTime para comparaciones.
$start_date_obj = new DateTime($fecha_inicio);
$end_date_obj = new DateTime($fecha_fin);
$today = new DateTime();

// Validar que la fecha de inicio no sea anterior a hoy.
if ($start_date_obj < $today->setTime(0,0,0)) {
    echo json_encode(["success" => false, "message" => "La fecha de inicio no puede ser en el pasado."]);
    exit();
}

// Validar que la fecha de fin sea posterior a la fecha de inicio.
if ($end_date_obj <= $start_date_obj) {
    echo json_encode(["success" => false, "message" => "La fecha de fin debe ser posterior a la fecha de inicio."]);
    exit();
}

// El estado inicial de la reserva es 'Pendiente'.
$estado = 'Pendiente';

// Preparar la consulta SQL para insertar la reserva.
$sql = "INSERT INTO Reserva (fecha_inicio, fecha_fin, estado, id_usuario, id_habitacion) VALUES (?, ?, ?, ?, ?)";
$stmt = $conexion->prepare($sql);

if ($stmt) {
    $stmt->bind_param("sssis", $fecha_inicio, $fecha_fin, $estado, $id_usuario, $id_habitacion);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Reserva creada con éxito."]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al crear la reserva: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Error al preparar la consulta de reserva: " . $conexion->error]);
}

$conexion->close();
?>
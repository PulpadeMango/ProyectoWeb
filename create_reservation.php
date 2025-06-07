<?php
session_start(); // Iniciar sesión para acceder a id_usuario
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Considera restringir esto en producción
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar solicitudes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Credenciales de la base de datos
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

// 1. Verificar si el usuario está autenticado
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión para realizar una reserva."]);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];

// Obtener los datos del cuerpo de la solicitud POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$id_habitacion = $data['id_habitacion'] ?? null;
$fecha_inicio = $data['fecha_inicio'] ?? null;
$fecha_fin = $data['fecha_fin'] ?? null;

// 2. Validar los datos recibidos
if (empty($id_habitacion) || empty($fecha_inicio) || empty($fecha_fin)) {
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos para la reserva."]);
    exit();
}

// Validar formato de fechas (opcional, pero recomendado)
if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $fecha_inicio) || !preg_match("/^\d{4}-\d{2}-\d{2}$/", $fecha_fin)) {
    echo json_encode(["success" => false, "message" => "Formato de fecha inválido. Usa YYYY-MM-DD."]);
    exit();
}

// Convertir a objetos DateTime para comparación
$start_date_obj = new DateTime($fecha_inicio);
$end_date_obj = new DateTime($fecha_fin);
$today = new DateTime();

// Validar que la fecha de inicio no sea anterior a hoy
if ($start_date_obj < $today->setTime(0,0,0)) { // Comparar solo la fecha, sin hora
    echo json_encode(["success" => false, "message" => "La fecha de inicio no puede ser en el pasado."]);
    exit();
}

// Validar que la fecha de fin sea posterior a la fecha de inicio
if ($end_date_obj <= $start_date_obj) {
    echo json_encode(["success" => false, "message" => "La fecha de fin debe ser posterior a la fecha de inicio."]);
    exit();
}


// 3. Insertar la reserva en la base de datos
// 'estado' se establecerá en 'Pendiente' por defecto como en tu tabla
$estado = 'Pendiente';

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
<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Asegurarse de que el usuario esté autenticado antes de continuar.
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Usuario no autenticado."]);
    exit();
}

$id_usuario_sesion = $_SESSION['id_usuario'];

// Parámetros de conexión a la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$password = '19Mi77do21ri';
$database = 'hotelesresidenciadelbien_db';

$conexion = new mysqli($host, $user, $password, $database);
if ($conexion->connect_error) {
    echo json_encode(["success" => false, "message" => "Conexión fallida a la base de datos: " . $conexion->connect_error]);
    exit();
}

// Decodificar la entrada JSON del cuerpo de la solicitud.
$input = json_decode(file_get_contents("php://input"), true);
$id_hotel = $input['id_hotel'] ?? null;
$id_usuario_reseña = $input['id_usuario'] ?? null; 
$calificacion = $input['calificacion'] ?? null;
$comentario = $input['comentario'] ?? null;

// Validar que todos los campos obligatorios estén presentes.
if (!$id_hotel || !$calificacion || $comentario === null) {
    echo json_encode(["success" => false, "message" => "Todos los campos (hotel, calificación, comentario) son obligatorios."]);
    $conexion->close();
    exit();
}

// Sanitizar y validar que las entradas numéricas sean válidas.
if (!is_numeric($id_hotel) || !is_numeric($calificacion)) {
    echo json_encode(["success" => false, "message" => "ID de hotel y calificación deben ser números válidos."]);
    $conexion->close();
    exit();
}

// Verificación de seguridad: Asegurarse de que el usuario que envía la reseña coincide con el usuario autenticado en la sesión.
if ($id_usuario_sesion != $id_usuario_reseña) {
    echo json_encode(["success" => false, "message" => "Error de seguridad: ID de usuario no coincide con la sesión."]);
    $conexion->close();
    exit();
}

// Validar que la calificación esté dentro del rango aceptable (1-5).
if ($calificacion < 1 || $calificacion > 5) {
    echo json_encode(["success" => false, "message" => "La calificación debe ser un número entre 1 y 5."]);
    $conexion->close();
    exit();
}

// Validar la longitud del comentario.
if (strlen($comentario) < 10 || strlen($comentario) > 500) { 
    echo json_encode(["success" => false, "message" => "El comentario debe tener entre 10 y 500 caracteres."]);
    $conexion->close();
    exit();
}

// Verificar si el usuario tiene una reserva completada para este hotel específico.
$sql_check_reserva = "
    SELECT COUNT(R.id_reserva) AS total
    FROM Reserva R
    JOIN Habitacion H ON R.id_habitacion = H.id_habitacion
    WHERE R.id_usuario = ? 
      AND H.id_hotel = ? 
      AND R.estado = 'Completada'
";
$stmt_check_reserva = $conexion->prepare($sql_check_reserva);

if (!$stmt_check_reserva) {
    echo json_encode(["success" => false, "message" => "Error interno al preparar la verificación de reserva: " . $conexion->error]);
    $conexion->close();
    exit();
}
$stmt_check_reserva->bind_param("ii", $id_usuario_sesion, $id_hotel);
$stmt_check_reserva->execute();
$result_check_reserva = $stmt_check_reserva->get_result();
$row_check_reserva = $result_check_reserva->fetch_assoc();
$stmt_check_reserva->close();

if ($row_check_reserva['total'] === 0) {
    echo json_encode(["success" => false, "message" => "No tienes una reserva completada para este hotel para poder dejar una reseña."]);
    $conexion->close();
    exit();
}

// Comprobar si el usuario ya ha enviado una reseña para este hotel.
$stmt_check_review = $conexion->prepare("SELECT COUNT(*) AS total FROM Reseña WHERE id_usuario = ? AND id_hotel = ?");
if (!$stmt_check_review) {
    echo json_encode(["success" => false, "message" => "Error interno al preparar la verificación de reseña existente: " . $conexion->error]);
    $conexion->close();
    exit();
}
$stmt_check_review->bind_param("ii", $id_usuario_sesion, $id_hotel);
$stmt_check_review->execute();
$result_check_review = $stmt_check_review->get_result();
$row_check_review = $result_check_review->fetch_assoc();
$stmt_check_review->close();

if ($row_check_review['total'] > 0) {
    echo json_encode(["success" => false, "message" => "Ya has dejado una reseña para este hotel."]);
    $conexion->close();
    exit();
}

// Insertar la nueva reseña en la base de datos.
$stmt_insert = $conexion->prepare("INSERT INTO Reseña (id_hotel, id_usuario, calificacion, comentario, fecha_reseña) VALUES (?, ?, ?, ?, NOW())");
if (!$stmt_insert) {
    echo json_encode(["success" => false, "message" => "Error interno al preparar la inserción de reseña: " . $conexion->error]);
    $conexion->close();
    exit();
}
$stmt_insert->bind_param("iiis", $id_hotel, $id_usuario_sesion, $calificacion, $comentario);

if ($stmt_insert->execute()) {
    echo json_encode(["success" => true, "message" => "Reseña publicada con éxito."]);
} else {
    echo json_encode(["success" => false, "message" => "Error al publicar la reseña: " . $stmt_insert->error]);
}

$stmt_insert->close();
$conexion->close();
?>
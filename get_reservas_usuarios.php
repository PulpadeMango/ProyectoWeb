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
    die(json_encode(["error" => "Conexión fallida: " . $conexion->connect_error]));
}

// Asegurarse de que el usuario esté autenticado.
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["error" => "No has iniciado sesión."]);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];

// Consulta SQL para obtener las reservas del usuario, incluyendo detalles de la habitación y el hotel.
$sql = "
SELECT
    r.id_reserva,
    r.fecha_inicio,
    r.fecha_fin,
    r.estado,
    h.numero AS numero_habitacion,
    h.tipo AS tipo_habitacion,
    h.precio AS precio_habitacion,
    ho.nombre AS nombre_hotel,
    ho.imagen_url AS imagen_hotel
FROM Reserva r
JOIN Habitacion h ON r.id_habitacion = h.id_habitacion
JOIN hoteles ho ON h.id_hotel = ho.id
WHERE r.id_usuario = ?
ORDER BY r.fecha_inicio DESC
";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();

$resultado = $stmt->get_result();
$reservas = [];

// Recorrer los resultados y almacenarlos en un array.
while ($fila = $resultado->fetch_assoc()) {
    $reservas[] = $fila;
}

// Devolver las reservas como JSON.
echo json_encode($reservas);
$stmt->close();
$conexion->close();
?>
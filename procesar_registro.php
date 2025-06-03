<?php
session_start();

// Obtener datos del formulario
$nombre     = trim($_POST['nombre']);
$correo     = trim($_POST['correo']);
$telefono   = trim($_POST['telefono']);
$contrasena = password_hash($_POST['contrasena'], PASSWORD_DEFAULT);

// Validación del correo y teléfono
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
  $_SESSION['registro_error'] = "Correo inválido.";
  header("Location: register.php");
  exit();
}

if (!preg_match("/^[0-9]{10}$/", $telefono)) {
  $_SESSION['registro_error'] = "El teléfono debe tener exactamente 10 dígitos numéricos.";
  header("Location: register.php");
  exit();
}

// Conexión a la base de datos
$host     = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$usuario  = '415850_donovan';
$clave    = '19Mi77do21ri';
$bd       = 'hotelesresidenciadelbien_db';

$conn = new mysqli($host, $usuario, $clave, $bd);

if ($conn->connect_error) {
  die("Conexión fallida: " . $conn->connect_error);
}

// Verificar si el correo ya existe
$sql_check = "SELECT id_usuario FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql_check);
$stmt->bind_param("s", $correo);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
  $_SESSION['registro_error'] = "El correo ya está registrado.";
  $stmt->close();
  $conn->close();
  header("Location: register.php");
  exit();
}
$stmt->close();

// Insertar nuevo usuario
$sql_insert = "INSERT INTO usuarios (nombre, correo, telefono, contrasena) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql_insert);
$stmt->bind_param("ssss", $nombre, $correo, $telefono, $contrasena);

if ($stmt->execute()) {
  $_SESSION['usuario'] = $nombre;
  $_SESSION['correo'] = $correo;
  $_SESSION['id_usuario'] = $stmt->insert_id;
  header("Location: index.html");
  exit();
} else {
  $_SESSION['registro_error'] = "Error al registrar. Intenta de nuevo.";
  header("Location: register.php");
  exit();
}

$stmt->close();
$conn->close();
?>

<?php
session_start();

// Conexión a la base de datos
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net'; 
$usuario = '415850_donovan';   
$clave = '19Mi77do21ri';  
$base_datos = 'hotelesresidenciadelbien_db'; 

$conn = new mysqli($host, $usuario, $clave, $base_datos);
if ($conn->connect_error) {
  die("Conexión fallida: " . $conn->connect_error);
}

// Sanitizar entrada
$correo = trim($_POST['correo']);
$contrasena = $_POST['contrasena'];

// Buscar usuario
$sql = "SELECT id_usuario, nombre, contrasena FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $correo);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
  $usuario = $resultado->fetch_assoc();

  if (password_verify($contrasena, $usuario['contrasena'])) {
    // Login correcto
    $_SESSION['usuario'] = $usuario['nombre'];
    $_SESSION['correo'] = $correo;
    $_SESSION['id_usuario'] = $usuario['id'];
    header("Location: index.html");
    exit();
  } else {
    $_SESSION['login_error'] = "Contraseña incorrecta.";
    header("Location: login.php");
    exit();
  }
} else {
  $_SESSION['login_error'] = "Correo no registrado.";
  header("Location: login.php");
  exit();
}

$stmt->close();
$conn->close();
?>
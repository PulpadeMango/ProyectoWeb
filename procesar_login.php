<?php
session_start(); // Asegúrate de que esta línea esté aquí al inicio

// Conexión a la base de datos (asegúrate de que tus credenciales estén correctas aquí también)
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$clave = '19Mi77do21ri'; // Tu contraseña de la base de datos
$base_datos = 'hotelesresidenciadelbien_db';

$conn = new mysqli($host, $user, $clave, $base_datos);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Sanitizar entrada
$correo = trim($_POST['correo']);
$contrasena = $_POST['contrasena'];

// Buscar usuario
// Asegúrate de que la columna se llama 'id_usuario' en tu tabla 'usuarios'
$sql = "SELECT id_usuario, nombre, contrasena FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    // Si la preparación de la consulta falla
    $_SESSION['login_error'] = "Error interno: Falló la preparación de la consulta.";
    header("Location: login.php"); // O a la página de login
    exit();
}

$stmt->bind_param("s", $correo);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $usuario = $resultado->fetch_assoc();

    if (password_verify($contrasena, $usuario['contrasena'])) {
        // Login correcto
        $_SESSION['usuario'] = $usuario['nombre'];
        $_SESSION['correo'] = $correo;
        $_SESSION['id_usuario'] = $usuario['id_usuario']; // <--- ¡CAMBIO AQUÍ!
        header("Location: index.html");
        exit();
    } else {
        // Contraseña incorrecta
        $_SESSION['login_error'] = "Contraseña incorrecta.";
        header("Location: login.php"); // O a la página de login
        exit();
    }
} else {
    // Usuario no encontrado
    $_SESSION['login_error'] = "Correo no registrado.";
    header("Location: login.php"); // O a la página de login
    exit();
}

$stmt->close();
$conn->close();
?>
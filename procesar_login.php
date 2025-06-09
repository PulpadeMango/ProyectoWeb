<?php
session_start(); // Inicia la sesión para almacenar información del usuario y mensajes de error.

// Credenciales de conexión a la base de datos.
$host = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$user = '415850_donovan';
$clave = '19Mi77do21ri'; // Contraseña de la base de datos.
$base_datos = 'hotelesresidenciadelbien_db';

// Establece la conexión con la base de datos.
$conn = new mysqli($host, $user, $clave, $base_datos);

// Verifica si la conexión falló.
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error); // Muestra un mensaje de error y termina el script.
}

// Sanitiza y obtiene el correo electrónico y la contraseña del formulario.
$correo = trim($_POST['correo']);
$contrasena = $_POST['contrasena'];

// Prepara la consulta SQL para buscar el usuario por correo electrónico.
// Se selecciona el id_usuario, nombre y la contraseña (hasheada) de la tabla 'usuarios'.
$sql = "SELECT id_usuario, nombre, contrasena FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql);

// Verifica si la preparación de la consulta falló.
if (!$stmt) {
    $_SESSION['login_error'] = "Error interno: Falló la preparación de la consulta.";
    header("Location: login.php"); // Redirige de vuelta a la página de login con un error.
    exit();
}

// Vincula el parámetro 'correo' a la consulta preparada.
$stmt->bind_param("s", $correo);
// Ejecuta la consulta.
$stmt->execute();
// Obtiene el resultado de la consulta.
$resultado = $stmt->get_result();

// Verifica si se encontró exactamente un usuario con ese correo.
if ($resultado->num_rows === 1) {
    $usuario = $resultado->fetch_assoc(); // Obtiene los datos del usuario.

    // Verifica si la contraseña proporcionada coincide con la contraseña hasheada en la base de datos.
    if (password_verify($contrasena, $usuario['contrasena'])) {
        // Inicio de sesión exitoso: almacena información del usuario en la sesión.
        $_SESSION['usuario'] = $usuario['nombre'];
        $_SESSION['correo'] = $correo;
        $_SESSION['id_usuario'] = $usuario['id_usuario']; // Guarda el ID del usuario en la sesión.
        header("Location: index.html"); // Redirige a la página principal.
        exit();
    } else {
        // Contraseña incorrecta.
        $_SESSION['login_error'] = "Contraseña incorrecta.";
        header("Location: login.php"); // Redirige al login con un mensaje de error.
        exit();
    }
} else {
    // Usuario no encontrado (correo no registrado).
    $_SESSION['login_error'] = "Correo no registrado.";
    header("Location: login.php"); // Redirige al login con un mensaje de error.
    exit();
}

// Cierra la declaración preparada y la conexión a la base de datos.
$stmt->close();
$conn->close();
?>
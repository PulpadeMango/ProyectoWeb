<?php
session_start(); // Inicia la sesión para almacenar mensajes de error o información del usuario.

// Obtiene y sanitiza los datos enviados desde el formulario de registro.
$nombre     = trim($_POST['nombre']);
$correo     = trim($_POST['correo']);
$telefono   = trim($_POST['telefono']);
$contrasena = password_hash($_POST['contrasena'], PASSWORD_DEFAULT); // Hashea la contraseña por seguridad.

// --- Validación de datos ---

// Valida que el formato del correo electrónico sea correcto.
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['registro_error'] = "Correo inválido."; // Almacena el mensaje de error en la sesión.
    header("Location: register.php"); // Redirige de vuelta a la página de registro.
    exit(); // Termina la ejecución del script.
}

// Valida que el teléfono tenga exactamente 10 dígitos numéricos.
if (!preg_match("/^[0-9]{10}$/", $telefono)) {
    $_SESSION['registro_error'] = "El teléfono debe tener exactamente 10 dígitos numéricos.";
    header("Location: register.php");
    exit();
}

// --- Conexión a la base de datos ---
$host       = 'mysql-hotelesresidenciadelbien.alwaysdata.net';
$usuario    = '415850_donovan';
$clave      = '19Mi77do21ri';
$bd         = 'hotelesresidenciadelbien_db';

$conn = new mysqli($host, $usuario, $clave, $bd);

// Verifica si la conexión a la base de datos falló.
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error); // Muestra un mensaje de error fatal.
}

// --- Verificar si el correo ya existe en la base de datos ---
$sql_check = "SELECT id_usuario FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql_check); // Prepara la consulta.
$stmt->bind_param("s", $correo); // Vincula el parámetro (correo).
$stmt->execute(); // Ejecuta la consulta.
$stmt->store_result(); // Almacena el resultado para poder usar num_rows.

// Si se encuentra al menos una fila, significa que el correo ya está registrado.
if ($stmt->num_rows > 0) {
    $_SESSION['registro_error'] = "El correo ya está registrado.";
    $stmt->close(); // Cierra la declaración.
    $conn->close(); // Cierra la conexión.
    header("Location: register.php");
    exit();
}
$stmt->close(); // Cierra la declaración después de la verificación.

// --- Insertar el nuevo usuario en la base de datos ---
$sql_insert = "INSERT INTO usuarios (nombre, correo, telefono, contrasena) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql_insert); // Prepara la consulta de inserción.
$stmt->bind_param("ssss", $nombre, $correo, $telefono, $contrasena); // Vincula los parámetros.

// Ejecuta la inserción y verifica si fue exitosa.
if ($stmt->execute()) {
    // Registro exitoso: Almacena la información del nuevo usuario en la sesión.
    $_SESSION['usuario'] = $nombre;
    $_SESSION['correo'] = $correo;
    $_SESSION['id_usuario'] = $stmt->insert_id; // Obtiene el ID generado para el nuevo usuario.
    header("Location: index.html"); // Redirige al usuario a la página principal.
    exit();
} else {
    // Error al registrar el usuario.
    $_SESSION['registro_error'] = "Error al registrar. Intenta de nuevo.";
    header("Location: register.php");
    exit();
}

$stmt->close(); // Cierra la declaración.
$conn->close(); // Cierra la conexión a la base de datos.
?>
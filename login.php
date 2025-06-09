<?php
session_start(); // Iniciar sesión para manejar mensajes de error.
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Iniciar sesión - Hoteles</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <h2>Iniciar sesión</h2>

    <?php
    // Mostrar mensaje de error si existe y luego eliminarlo de la sesión.
    if (isset($_SESSION['login_error'])) {
        echo "<p style='color:red'>" . $_SESSION['login_error'] . "</p>";
        unset($_SESSION['login_error']);
    }
    ?>

    <div class="form-container">
        <form action="procesar_login.php" method="post">
            <label for="correo">Correo electrónico:</label>
            <input type="email" name="correo" required>

            <label for="contrasena">Contraseña:</label>
            <input type="password" name="contrasena" required>

            <button type="submit">Iniciar sesión</button>
        </form>
        <p>¿No tienes cuenta? <a href="register.php">Regístrate aquí</a></p>
    </div>
</body>
</html>
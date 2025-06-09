<?php
session_start(); // Inicia la sesión para poder acceder a mensajes de error si los hay.
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro - Hoteles</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <h2>Registro de usuario</h2>

    <?php
    // Verifica si hay un mensaje de error de registro en la sesión.
    if (isset($_SESSION['registro_error'])) {
        // Muestra el mensaje de error con una clase CSS para estilizarlo.
        echo "<p class='mensaje-error'>" . $_SESSION['registro_error'] . "</p>";
        // Elimina el mensaje de error de la sesión para que no se muestre de nuevo al recargar.
        unset($_SESSION['registro_error']);
    }
    ?>

    <div class="form-container">
        <form action="procesar_registro.php" method="post">
            <label for="nombre">Nombre completo:</label>
            <input type="text" name="nombre" required>

            <label for="correo">Correo electrónico:</label>
            <input type="email" name="correo" required>

            <label for="telefono">Teléfono:</label>
            <input type="text" name="telefono" pattern="[0-9]{10}" maxlength="10"
                   title="Debe tener 10 dígitos numéricos" required>

            <label for="contrasena">Contraseña:</label>
            <input type="password" name="contrasena" required>

            <button type="submit">Registrarse</button>
        </form>

        <p>¿Ya tienes una cuenta? <a href="login.php">Iniciar sesión</a></p>
    </div>

</body>
</html>
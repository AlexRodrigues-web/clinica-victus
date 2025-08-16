<?php
// backend/controllers/_pdo.php
function cv_get_pdo(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $host = getenv('DB_HOST') ?: 'localhost';
  $db   = getenv('DB_NAME') ?: 'clinica_victus';
  $user = getenv('DB_USER') ?: 'root';
  $pass = getenv('DB_PASS') ?: '';
  $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";

  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

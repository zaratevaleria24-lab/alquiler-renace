-- Límite de intentos de login POR CUENTA, además de por IP.  (2026-07-29)
--
-- POR QUÉ HACE FALTA: el límite que había contaba solo por hash de IP (8 fallos
-- cada 15 minutos). Contra un atacante con muchas IPs —o que simplemente
-- falsificaba la cabecera CF-Connecting-IP, cosa que era posible hasta hoy— cada
-- IP gastaba su cupo de 8 y ninguna se bloqueaba nunca. Un contador por cuenta
-- pone un techo que no depende del origen de la petición.
--
-- El índice es por (lower(email), created_at DESC) porque la consulta filtra por
-- correo normalizado y por ventana de tiempo. Sin él, cada intento de login
-- haría un recorrido secuencial de la tabla, que solo crece.

CREATE INDEX IF NOT EXISTS login_attempts_email_recent_idx
  ON login_attempts (lower(email), created_at DESC);

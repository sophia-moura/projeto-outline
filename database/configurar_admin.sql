USE outline;

UPDATE usuarios
SET senha_hash = '$2b$10$2qR6XZ/b9PAIXPugbGxx3uyRuR64VBkOLuXzdC0GQhx7csVqiejpK'
WHERE email = 'admin@outline.com'
AND perfil = 'admin';
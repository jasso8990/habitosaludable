# E2EE para notas devocionales

Las notas personales (`devotional_notes.note`) soportan cifrado end-to-end incremental:

- Al guardar, el cliente cifra la nota con la llave pública del usuario (`user_keyring.public_key`) y almacena el valor con prefijo `__E2EE_NOTE__`.
- Al leer, si existe el prefijo, se intenta descifrar con la llave privada local (`SecureStore`).
- Compatibilidad retroactiva: si una nota no tiene prefijo, se trata como texto plano legado.
- Si una nota cifrada no puede descifrarse en el dispositivo actual (por ejemplo, falta llave privada), se muestra una advertencia sin exponer contenido.

- Requiere sesión activa para cifrar/guardar en Supabase; si no hay sesión, la UI informa al usuario.

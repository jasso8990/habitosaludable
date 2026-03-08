# Chat E2EE (fase incremental)

## Qué se cifró
- Mensajes de texto (`type: text`) se almacenan en `messages.content` como envelope E2EE (`__E2EE__...`).
- El envelope incluye payload cifrado por participante (1:1) usando su llave pública de `user_keyring`.

## Flujo
1. Al enviar texto, se consulta la conversación para obtener participantes.
2. Se consultan llaves públicas en `user_keyring`.
3. Se cifra el mismo texto para cada usuario y se guarda en envelope.
4. Al leer/suscribir mensajes, el cliente descifra con su llave privada local (`SecureStore`).

## Fallback
- Si no hay llave privada local o no existe payload para ese usuario, se muestra `🔐 Mensaje cifrado`.

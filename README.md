# 🌱 Hábitos Saludables - Guía Completa de Instalación

## ¿Qué es este proyecto?
Una aplicación móvil para iOS y Android que te ayuda a crear hábitos saludables basada en:
- 📘 Hábitos Atómicos (James Clear)
- 🔥 Seminario Fénix
- 🤝 Cómo Ganar Amigos e Influir en las Personas (Dale Carnegie)

---

## 📋 PASO 1: Herramientas que necesitas instalar (GRATIS)

### En tu computadora instala estos programas en orden:

1. **Node.js** (el motor de la app)
   - Ve a: https://nodejs.org
   - Descarga la versión "LTS" (la recomendada)
   - Instálala con todas las opciones por defecto

2. **Git** (para subir código a GitHub)
   - Ve a: https://git-scm.com
   - Descarga e instala para tu sistema operativo

3. **Visual Studio Code** (editor de código, opcional pero recomendado)
   - Ve a: https://code.visualstudio.com
   - Instala la versión para tu sistema

4. **Expo Go** (para probar la app en tu celular)
   - En tu iPhone: busca "Expo Go" en App Store
   - En Android: busca "Expo Go" en Google Play

---

## 📋 PASO 2: Crear cuentas gratuitas

### A) GitHub (donde guardas el código)
1. Ve a https://github.com
2. Clic en "Sign up"
3. Crea tu cuenta gratuita
4. Guarda tu usuario y contraseña

### B) Supabase (tu base de datos GRATIS)
1. Ve a https://supabase.com
2. Clic en "Start your project"
3. Regístrate con tu cuenta de GitHub
4. Crea un nuevo proyecto:
   - Nombre: `habitos-saludables`
   - Contraseña de base de datos: crea una segura y GUÁRDALA
   - Región: `us-east-1` (o la más cercana a ti)
5. Espera 2 minutos mientras se crea
6. Ve a Settings > API y COPIA:
   - `Project URL` (algo como https://xxx.supabase.co)
   - `anon public key` (una clave larga)
   - GUÁRDALAS en un archivo de texto

### C) Cuenta de Anthropic (para el asistente IA)
1. Ve a https://console.anthropic.com
2. Crea una cuenta
3. Ve a "API Keys" y crea una nueva
4. COPIA y guarda esa clave

### D) Twilio (para verificación por SMS, GRATIS para pruebas)
1. Ve a https://twilio.com
2. Crea cuenta gratuita
3. Ve al dashboard y copia:
   - Account SID
   - Auth Token
   - Tu número de teléfono Twilio

---

## 📋 PASO 3: Descargar y configurar el proyecto

### Abrir la Terminal (línea de comandos)
- **Windows**: Presiona `Win + R`, escribe `cmd`, presiona Enter
- **Mac**: Presiona `Cmd + Space`, escribe `Terminal`, presiona Enter

### Ejecutar estos comandos (copia y pega uno por uno):

```bash
# 1. Clonar el proyecto de GitHub
git clone https://github.com/TU_USUARIO/habitos-saludables.git

# 2. Entrar a la carpeta
cd habitos-saludables

# 3. Instalar todas las dependencias
npm install

# 4. Crear tu archivo de configuración
cp .env.example .env
```

### Abrir el archivo `.env` y llenar con tus datos:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon-aqui
ANTHROPIC_API_KEY=tu-clave-anthropic-aqui
TWILIO_ACCOUNT_SID=tu-sid-aqui
TWILIO_AUTH_TOKEN=tu-token-aqui
TWILIO_PHONE=+1234567890
```

---

## 📋 PASO 4: Configurar la Base de Datos

1. Ve a tu proyecto en https://supabase.com
2. Clic en "SQL Editor" en el menú izquierdo
3. Abre los archivos en la carpeta `supabase/migrations/` de este proyecto
4. Copia y pega cada archivo SQL en el editor (en orden numérico)
5. Presiona "Run" en cada uno

---

## 📋 PASO 5: Subir a GitHub

```bash
# Estos comandos suben tu código a GitHub
git add .
git commit -m "Primera versión de Hábitos Saludables"
git push origin main
```

---

## 📋 PASO 6: Probar la app en tu celular

```bash
# En la terminal, dentro de la carpeta del proyecto:
npx expo start
```

Se abrirá una página web con un código QR.
- **iPhone**: Abre la cámara y apunta al código QR
- **Android**: Abre la app "Expo Go" y escanea el código QR

¡La app se abrirá en tu celular!

---

## 📋 PASO 7: Publicar en App Store y Google Play

Para publicar la app oficialmente necesitas:
- **Apple Developer Account**: $99 USD/año en https://developer.apple.com
- **Google Play Developer Account**: $25 USD único en https://play.google.com/console

Una vez que tengas esas cuentas, ejecuta:
```bash
npx expo build:ios    # Para iPhone
npx expo build:android # Para Android
```

---

## 🆘 ¿Necesitas ayuda?
Si algo no funciona, dime exactamente qué mensaje de error aparece y te ayudo a resolverlo paso a paso.

---

## 📁 Estructura del Proyecto
```
habitos-saludables/
├── app/
│   ├── auth/           ← Pantallas de login y registro
│   ├── screens/        ← Pantallas principales
│   ├── components/     ← Piezas reutilizables
│   ├── navigation/     ← Navegación entre pantallas
│   ├── services/       ← Conexión a internet y base de datos
│   ├── hooks/          ← Lógica reutilizable
│   ├── constants/      ← Colores y textos
│   └── i18n/           ← Traducciones español/inglés
├── supabase/
│   └── migrations/     ← Configuración de base de datos
├── admin/              ← Panel web del administrador
├── .env.example        ← Plantilla de configuración
├── app.json            ← Configuración de la app
└── package.json        ← Lista de dependencias
```

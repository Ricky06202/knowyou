Proyecto: "Recomendador Personalizado con Memoria"
📌 Visión General
Objetivo: Construir un asistente conversacional (chatbot) que recomiende contenido (videojuegos, películas, series, K-dramas y anime) basándose en un perfil de gustos que aprende y mejora con cada interacción.

El problema que resuelve: Cada vez que buscas algo nuevo, tienes que explicar tus gustos desde cero (por ejemplo: "me gusta Disgaea, La Tale, pero no Path of Exile"). Este sistema recuerda lo que te gusta y lo que no, y usa esa información para filtrar y recomendar contenido de forma proactiva.

Usuarios objetivo: Personas con gustos muy definidos que buscan descubrir contenido nuevo sin tener que repetir sus preferencias constantemente.

🎯 Objetivos Principales
Aprendizaje continuo: El sistema debe actualizar su perfil de usuario con cada interacción (gustos, disgustos, valoraciones).

Recomendación inteligente: Al recibir una petición ("Recomiéndame un juego"), debe buscar en las APIs correspondientes y filtrar los resultados según el perfil guardado.

Multicategoría: Debe soportar al menos cinco categorías: Videojuegos, Películas, Series, K-dramas y Anime, con la posibilidad de ampliarlas en el futuro.

Interfaz conversacional: El usuario debe poder chatear con el sistema de forma natural, como si hablara con un amigo que lo conoce.

🛠️ Arquitectura Técnica (Tecnologías Propuestas)
Componente Tecnología Sugerida Justificación
Backend Node.js + Express (o Python + Flask) Sencillo, rápido y con buena integración con APIs REST y GraphQL.
Base de Datos SQLite (para empezar) o MongoDB Para almacenar el perfil de usuario y las preferencias. SQLite es ligero para un prototipo.
APIs Externas RAWG (videojuegos), TMDB (películas y series), Jikan (anime), TVmaze (series) Son gratuitas, tienen buena documentación y cobertura.
Frontend React (o Vue.js) para una interfaz web, o un bot de Discord para simplificar Una interfaz web es más versátil y te permite incluir imágenes y formatos ricos.
Autenticación Simple (usuario/contraseña) o login con Google/GitHub Para que el perfil sea persistente entre sesiones.
📊 Estructura de Datos (Perfil de Usuario)
El sistema guardará un perfil para cada usuario con la siguiente estructura (ejemplo en JSON):

json
{
"usuarioId": "123abc",
"gustos": {
"videojuegos": {
"generosFavoritos": ["RPG", "Acción", "Estrategia"],
"juegosQueLeGustan": ["Disgaea", "La Tale", "Elsword"],
"juegosQueNoLeGustan": ["Path of Exile", "Diablo"],
"plataformas": ["PC", "Steam"]
},
"peliculas": {
"generos": ["Ciencia ficción", "Animación"],
"directores": ["Christopher Nolan"],
"actores": ["Keanu Reeves"]
},
// ... estructura similar para series, k-dramas, anime
},
"historial": {
"recomendacionesAceptadas": ["Juego X", "Película Y"],
"recomendacionesRechazadas": ["Juego Z"]
}
}
🔄 Flujo de Trabajo del Sistema
El usuario escribe un mensaje: Por ejemplo: "Recomiéndame un juego como Disgaea".

El backend recibe la petición: Identifica la categoría (videojuegos) y la intención (recomendar).

Consulta la API correspondiente: Por ejemplo, RAWG con filtros de género "RPG" y "Estrategia" o "Táctico".

Filtra los resultados: Elimina los juegos que ya están en la lista de "No me gustan" del perfil.

Enriquece los resultados: Obtiene imágenes, descripciones y valoraciones para presentarlos de forma atractiva.

Genera la respuesta: Presenta los juegos en formato de lista con imágenes y una breve descripción.

Aprende de la interacción: Pregunta al usuario: "¿Te interesa alguno de estos?" y guarda su respuesta en el perfil.

🗺️ Plan de Desarrollo (Fases)
Fase 1: El Núcleo Funcional (MVP)
Backend básico con un endpoint /chat que acepte mensajes y devuelva respuestas.

Integración con una API (ej. RAWG para videojuegos) para hacer búsquedas.

Sistema de perfil simple (guardado en archivo o SQLite) con gustos y disgustos manuales.

Interfaz de chat (web o Discord) para probar el sistema.

Fase 2: Expansión de Categorías
Añadir soporte para películas usando TMDB.

Añadir soporte para series usando TMDB o TVmaze.

Añadir soporte para anime usando Jikan (MyAnimeList).

Fase 3: Mejora de la Experiencia de Usuario
Mejorar el formato de respuesta: Incluir imágenes, valoraciones y enlaces.

Sistema de valoración: Permitir al usuario dar "me gusta" o "no me gusta" a las recomendaciones para mejorar el perfil.

Persistencia de sesión: Guardar el perfil en una base de datos para que no se pierda al cerrar el chat.

Fase 4: Funcionalidades Avanzadas
Recomendaciones proactivas: El sistema podría sugerir contenido sin que el usuario lo pida, basándose en su perfil.

Integración con más APIs: Buscar APIs para K-dramas o series asiáticas (si no están cubiertas por TMDB).

Modo "Sorpresa": Recomendar algo fuera de la zona de confort del usuario, pero con alta probabilidad de gustarle.

🎨 Notas sobre la Interfaz y Experiencia
Tono del asistente: Amigable, cercano y con un toque de humor. Debe sentirse como un amigo que conoce tus gustos.

Imágenes: Siempre que sea posible, mostrar imágenes de los juegos/películas recomendados (usando las URLs de las APIs).

Botones de acción: Incluir botones como "Me gusta", "No me gusta", "Ver más detalles" para facilitar la interacción.

✅ Criterios de Éxito (para evaluar el proyecto)
El usuario puede pedir una recomendación en cualquiera de las categorías y recibir una respuesta coherente y filtrada.

El sistema recuerda los gustos del usuario entre sesiones.

El perfil del usuario mejora las recomendaciones con el tiempo (se nota que el sistema "aprende").

🚀 Próximos Pasos (Cómo empezar)
Elige el stack tecnológico (Node.js o Python).

Regístrate en las APIs (RAWG, TMDB, Jikan, etc.) y obtén tus claves.

Crea el endpoint básico que reciba un mensaje y devuelva una respuesta de prueba.

Integra RAWG para empezar con videojuegos (es la más sencilla).

Añade la lógica de perfil para guardar gustos y disgustos.

Prueba y repite: Ve mejorando el sistema con cada iteración.

## 🚀 Reglas de Despliegue (Coolify)

### 1. Repositorio PÚBLICO siempre
- El repo es público. Las API keys NUNCA van en archivos del repo.
- Solo van en Coolify → Environment Variables.

### 2. Environment Variables
- `.env.example` solo con placeholders, NUNCA con keys reales.
- Si se exponen keys, purgar historial con:
  `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.example' -- --all`
  `git push --force`

### 3. APK Android
- No subir APK al repo. Usar GitHub Releases:
  `gh release create vX.Y.Z --title "KnowYou vX.Y.Z" --notes "..."`
  `gh release upload vX.Y.Z KnowYou.apk`
- Landing apunta a: `https://github.com/Ricky06202/knowyou/releases/latest/download/KnowYou.apk`
- No necesita redeploy al cambiar versión.

### 4. Docker Build
- NO descargar APK durante el build. El enlace a GitHub Releases es directo.
- Multi-stage: target `api` y `landing`, ambos en el mismo Dockerfile.
- Usar `wget` si se necesita descargar algo (más común en imágenes Alpine que `curl`).

### 5. Docker Compose
- PostgreSQL con healthcheck y start_period.
- API con depends_on condition: service_healthy.
- Landing con Astro build + `bun x serve` para servir estáticos.
- Variables postgres hardcodeadas con valores dev por defecto (override con env vars en Coolify).

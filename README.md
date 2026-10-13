# Icaro Barbarouses

Web del equipo de baloncesto amateur **Icaro Barbarouses**: calendario, resultados, estadísticas, jugadas en vídeo y asistencia a los partidos.

**Web:** https://carlosgmv19.github.io/Icaro-Barbarouses/

## Qué hay en la web

- **Inicio**: balance de la temporada, último y próximo partido, líderes del equipo.
- **Asistencia**: cada jugador dice si va al próximo partido, y se ve quién ha jugado cada jornada.
- **Calendario y partidos**: resultados, parciales y estadísticas de cada partido.
- **Plantilla y fichas de jugador**: medias, máximos, evolución y un rol que se calcula solo con sus estadísticas.
- **Estadísticas, gráficas, quintetos, récords e histórico**.
- **Jugadas**: clips de las mejores jugadas, con filtros por jugador, tipo de jugada y jornada.

Tiene dos versiones, **Básico** (pensada para el móvil) y **Completo**, que se cambian con el botón de arriba a la derecha.

## Cómo funciona

- Es una web estática alojada en GitHub Pages.
- Los datos están en un Google Sheet. Un script de Google Apps Script hace de puente: la web lee los datos a través de él y le envía las respuestas de asistencia.
- Los partidos se apuntan viendo el vídeo con una herramienta propia, que envía las estadísticas al Sheet. Esta herramienta y la de recortar jugadas solo están disponibles para quien lleva las estadísticas.
- La web calcula las medias, récords, quintetos y roles en el navegador a partir de los datos en bruto.

## Contenido del repositorio

| Carpeta / archivo | Qué es |
|---|---|
| `index.html`, `assets/` | La web: estilos, carga de datos, cálculos y páginas |
| `config.js` | Dirección del script de Google que da los datos |
| `herramientas/` | Herramientas para apuntar partidos y recortar jugadas |
| `jugadas/` | Clips de vídeo de las jugadas |
| `backend/` | Código del script de Google Apps Script |
| `datos-ejemplo.json` | Copia de datos para ver la web sin conexión al Sheet |

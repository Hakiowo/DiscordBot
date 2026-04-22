# BSG

BSG es un bot de Discord pensado para ofrecer interacciones entre usuarios, minijuegos y distintas utilidades dentro de un servidor. El proyecto está planteado con una arquitectura escalable para permitir la incorporación de nuevas funciones a futuro sin comprometer su crecimiento.

Actualmente el repositorio ya cuenta con una base inicial en `Node.js` y `discord.js`, preparada para crecer por modulos y categorias.

## Objetivo del proyecto

El propósito de BSG es convertirse en un bot versátil para comunidades de Discord, combinando entretenimiento, interacción social y herramientas útiles para los usuarios.

Entre sus metas principales se encuentran:

- Comandos de interacción entre usuarios.
- Minijuegos para mantener activa la comunidad.
- Funcionalidades generales para servidores de Discord.
- Estructura preparada para crecer con nuevos módulos y comandos.

## Funcionalidades previstas

BSG estará orientado a incluir, entre otras, las siguientes características:

- Interacciones sociales entre miembros del servidor.
- Minijuegos individuales y multijugador.
- Sistema de comandos organizado por categorías.
- Funciones administrativas y de utilidad.
- Posibles sistemas de progresión, economía o recompensas en el futuro.

## Escalabilidad

Uno de los pilares del proyecto es la escalabilidad. Esto significa que BSG está pensado para evolucionar con el tiempo, incorporando nuevas características según las necesidades del servidor o la dirección del proyecto.

La idea es mantener una base que permita:

- Añadir comandos sin desordenar la estructura.
- Separar funcionalidades por módulos.
- Facilitar el mantenimiento del código.
- Permitir futuras integraciones y mejoras.

## Estado actual

El proyecto se encuentra en una fase temprana de desarrollo, pero ya incluye una base funcional para seguir construyendo el bot:

- Punto de entrada principal.
- Cliente de Discord con `discord.js`.
- Sistema de carga dinamica de comandos.
- Sistema de carga dinamica de eventos.
- Configuracion mediante variables de entorno.
- Script para registrar comandos slash.
- Comandos iniciales de ejemplo.

## Tecnologias

La base actual del proyecto utiliza:

- JavaScript
- Node.js
- discord.js
- dotenv

## Estructura actual

La estructura base del proyecto quedo organizada de la siguiente manera:

```text
BSG/
├── src/
│   ├── bot/
│   ├── commands/
│   │   ├── admin/
│   │   ├── economy/
│   │   ├── games/
│   │   ├── interaction/
│   │   ├── moderation/
│   │   └── utility/
│   ├── config/
│   ├── database/
│   ├── events/
│   ├── handlers/
│   ├── scripts/
│   ├── services/
│   ├── systems/
│   └── utils/
├── data/
├── logs/
├── index.js
├── package.json
└── README.md
```

## Configuracion inicial

1. Instalar dependencias:

```bash
npm install
```

2. Crear tu archivo `.env` tomando como referencia `.env.example`.

3. Completar las variables necesarias:

```env
DISCORD_TOKEN=tu_token_aqui
DISCORD_CLIENT_ID=tu_client_id_aqui
DISCORD_GUILD_ID=tu_guild_id_aqui
```

`DISCORD_GUILD_ID` es opcional, pero resulta util para registrar comandos slash en un servidor concreto durante desarrollo.

## Scripts disponibles

```bash
npm start
```

Inicia el bot.

```bash
npm run register
```

Registra los comandos slash del proyecto. Si defines `DISCORD_GUILD_ID`, el registro se hace a nivel de servidor; si no, se registran de forma global.

## Base implementada

Actualmente BSG ya incluye:

- Cliente inicial de Discord en `src/bot/`.
- Cargador dinamico de comandos en `src/handlers/loadCommands.js`.
- Cargador dinamico de eventos en `src/handlers/loadEvents.js`.
- Evento `ready` inicial.
- Manejo base de `interactionCreate`.
- Comando `/ping`.
- Comando `/avatar`.

## Roadmap inicial

- Definir la estructura base del bot.
- Integrar el cliente de Discord.
- Crear un sistema de comandos modular.
- Implementar los primeros comandos de interacción.
- Añadir minijuegos iniciales.
- Expandir funcionalidades según el crecimiento del proyecto.

## Visión

BSG busca ser un bot flexible, entretenido y en constante crecimiento, capaz de adaptarse a distintos tipos de comunidades en Discord y de seguir ampliándose con nuevas ideas y sistemas.

## Autor

Proyecto desarrollado para la creación del bot de Discord **BSG**.

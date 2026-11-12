# Oficina IA

Oficina 3D isométrica de agentes de IA: cada agente es una persona con su rol, su oficina (por función: Backend, Frontend, Datos, Contenido, QA) y su IA (Gemini, Claude, ChatGPT, Copilot u otra compatible OpenAI). Se coordinan por roles (Backend, Frontend, QA…) para cumplir tareas.

## Estructura
- `src/a_head.html` – HTML + CSS
- `src/j1.js` – datos, geometría del edificio, oficinas temáticas
- `src/j2.js` – renderer, personajes, cámara, interacción
- `src/j3.js` – interfaz, coordinación (QA con bucle de corrección), arranque
- `server/oficina-server.js` – servidor local (Node 18+, sin dependencias) que conecta la web con tu PC
- `start.bat` / `start.sh` – lanzadores del servidor
- `build.sh` – genera `index.html` (archivo único)

## Estado
- Fase 1 (simulado): oficina, agentes, chat, animaciones; Claude real vía artefacto de claude.ai; las demás IAs simuladas.
- Fase 2 (hecha): conexión a tu PC.
  - Las API keys (Claude, ChatGPT, Gemini, GitHub Models/Copilot, compatibles OpenAI) se guardan en `server/data/config.json` (solo en tu PC) y las llamadas a la IA salen desde el servidor.
  - Los agentes guardan su trabajo en la carpeta de trabajo (`~/OficinaIA/proyectos/<fecha>-<tarea>/`), con el código extraído a `codigo/`.
  - El QA recibe el resultado de una verificación real de sintaxis (js, json, py, sh) antes de opinar.

## Instalación (un solo comando)
Necesitás Node.js 18+ (https://nodejs.org) y git. No hay dependencias que instalar.

```
git clone https://github.com/matycody/Oficina_IA.git
cd Oficina_IA
npm start
```

(También sirve `start.bat` en Windows o `./start.sh` en Mac/Linux.)

El servidor imprime un link tipo `http://localhost:8787/#token=…`: abrilo y la web se conecta sola a tu PC. Después cargás las API keys en Ajustes. Para actualizar: `git pull` y `npm start`.
Opciones: `npm start -- --port 8788 --workspace D:\MisProyectos`.

Seguridad: el servidor solo escucha en 127.0.0.1, exige una clave de acceso, rechaza otros orígenes y solo toca la carpeta de trabajo. No ejecuta comandos arbitrarios ni corre el código generado: solo verifica su sintaxis.
- Más adelante: casas, parques y vacaciones para representar el cupo agotado.

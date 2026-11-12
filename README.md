# Oficina IA

Oficina 3D isométrica de agentes de IA: cada IA (Claude, Copilot, Gemini, ChatGPT…) es una persona con su oficina, su plan y su cupo de 5 h. Se coordinan por roles (Backend, Frontend, QA…) para cumplir tareas.

## Estructura
- `src/a_head.html` – HTML + CSS
- `src/j1.js` – datos, geometría del edificio, oficinas temáticas
- `src/j2.js` – renderer, personajes, cámara, interacción
- `src/j3.js` – interfaz, coordinación (QA con bucle de corrección), arranque
- `build.sh` – genera `index.html` (archivo único)

## Estado
- Fase 1 (simulado): Claude real vía artefacto de claude.ai; las demás IAs son simuladas.
- Fase 2 (pendiente): APIs reales (Gemini AI Studio, GitHub Models) en ejecución local y compilación real por QA.
- Más adelante: casas, parques y vacaciones para representar el cupo agotado.

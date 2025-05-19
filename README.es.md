[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.md)
[![zh](https://img.shields.io/badge/lang-zh-green.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.zh.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/pogjester/company-research-agent/blob/main/README.es.md)

# Investigador de Empresas 🔍

![interfaz web](<static/ui-1.png>)

Una herramienta multi-agente que genera informes de investigación exhaustivos sobre empresas. La plataforma utiliza un sistema de agentes de IA para recopilar, seleccionar y sintetizar información sobre cualquier empresa.

✨¡Pruébalo en línea! https://companyresearcher.tavily.com ✨

https://github.com/user-attachments/assets/0e373146-26a7-4391-b973-224ded3182a9

## Características

- **Investigación Multi-Fuente**: Recopila datos de diversas fuentes, incluyendo sitios web de empresas, artículos de noticias, informes financieros y análisis sectoriales
- **Filtrado de Contenido Impulsado por IA**: Utiliza la puntuación de relevancia de Tavily para la selección de contenido
- **Transmisión de Progreso en Tiempo Real**: Utiliza conexiones WebSocket para transmitir el progreso de la investigación y los resultados
- **Arquitectura de Modelo Dual**: 
  - Gemini 2.0 Flash para síntesis de investigación de alto contexto
  - GPT-4.1 para formato preciso y edición de informes
- **Frontend Moderno en React**: Interfaz de usuario receptiva con actualizaciones en tiempo real, seguimiento de progreso y opciones de descarga
- **Arquitectura Modular**: Construido utilizando un sistema de nodos de investigación y procesamiento especializados

## Marco de Agentes

### Sistema de Investigación

La plataforma sigue un marco basado en agentes con nodos especializados que procesan datos secuencialmente:

1. **Nodos de Investigación**:
   - `CompanyAnalyzer`: Investiga información básica del negocio
   - `IndustryAnalyzer`: Analiza posición de mercado y tendencias
   - `FinancialAnalyst`: Recopila métricas financieras y datos de rendimiento
   - `NewsScanner`: Recopila noticias y desarrollos recientes

2. **Nodos de Procesamiento**:
   - `Collector`: Agrega datos de investigación de todos los analizadores
   - `Curator`: Implementa filtrado de contenido y puntuación de relevancia
   - `Briefing`: Genera resúmenes específicos por categoría utilizando Gemini 2.0 Flash
   - `Editor`: Compila y formatea los resúmenes en un informe final utilizando GPT-4.1-mini

   ![interfaz web](<static/agent-flow.png>)

### Arquitectura de Generación de Contenido

La plataforma aprovecha modelos separados para un rendimiento óptimo:

1. **Gemini 2.0 Flash** (`briefing.py`):
   - Maneja tareas de síntesis de investigación de alto contexto
   - Sobresale en el procesamiento y resumen de grandes volúmenes de datos
   - Utilizado para generar resúmenes iniciales por categoría
   - Eficiente en mantener el contexto a través de múltiples documentos

2. **GPT-4.1 mini** (`editor.py`):
   - Se especializa en tareas precisas de formato y edición
   - Maneja la estructura y consistencia en markdown
   - Superior en seguir instrucciones exactas de formato
   - Utilizado para:
     - Compilación final del informe
     - Eliminación de duplicados de contenido
     - Formateo en markdown
     - Transmisión de informes en tiempo real

Este enfoque combina la fortaleza de Gemini en el manejo de ventanas de contexto grandes con la precisión de GPT-4.1-mini en seguir instrucciones específicas de formato.

### Sistema de Selección de Contenido

La plataforma utiliza un sistema de filtrado de contenido en `curator.py`:

1. **Puntuación de Relevancia**:
   - Los documentos son puntuados por la búsqueda potenciada por IA de Tavily
   - Se requiere un umbral mínimo (predeterminado 0.4) para proceder
   - Las puntuaciones reflejan la relevancia para la consulta de investigación específica
   - Puntuaciones más altas indican mejores coincidencias con la intención de la investigación

2. **Procesamiento de Documentos**:
   - El contenido se normaliza y limpia
   - Las URLs se desduplicaron y estandarizaron
   - Los documentos se ordenan por puntuaciones de relevancia
   - Las actualizaciones de progreso en tiempo real se envían a través de WebSocket

### Sistema de Comunicación en Tiempo Real

La plataforma implementa un sistema de comunicación en tiempo real basado en WebSocket:

![interfaz web](<static/ui-2.png>)

1. **Implementación Backend**:
   - Utiliza el soporte de WebSocket de FastAPI
   - Mantiene conexiones persistentes por trabajo de investigación
   - Envía actualizaciones de estado estructuradas para varios eventos:
     ```python
     await websocket_manager.send_status_update(
         job_id=job_id,
         status="processing",
         message=f"Generating {category} briefing",
         result={
             "step": "Briefing",
             "category": category,
             "total_docs": len(docs)
         }
     )
     ```

2. **Integración Frontend**:
   - Los componentes de React se suscriben a actualizaciones WebSocket
   - Las actualizaciones se procesan y muestran en tiempo real
   - Diferentes componentes de UI manejan tipos específicos de actualizaciones:
     - Progreso de generación de consultas
     - Estadísticas de selección de documentos
     - Estado de finalización de resúmenes
     - Progreso de generación de informes

3. **Tipos de Estado**:
   - `query_generating`: Actualizaciones en tiempo real de creación de consultas
   - `document_kept`: Progreso de selección de documentos
   - `briefing_start/complete`: Estado de generación de resúmenes
   - `report_chunk`: Transmisión de generación de informes
   - `curation_complete`: Estadísticas finales de documentos

## Instalación

### Instalación Rápida (Recomendada)

La forma más sencilla de comenzar es utilizando el script de instalación:

1. Clonar el repositorio:
```bash
git clone https://github.com/pogjester/tavily-company-research.git
cd tavily-company-research
```

2. Hacer que el script de instalación sea ejecutable y ejecutarlo:
```bash
chmod +x setup.sh
./setup.sh
```

El script de instalación hará lo siguiente (usará `uv` automáticamente si está instalado):
- Verificar las versiones requeridas de Python y Node.js
- Opcionalmente crear un entorno virtual de Python (recomendado)
- Instalar todas las dependencias (Python y Node.js)
- Guiarte a través de la configuración de tus variables de entorno
- Opcionalmente iniciar los servidores de backend y frontend

Necesitarás tener listas las siguientes claves API:
- Clave API de Tavily
- Clave API de Google Gemini
- Clave API de OpenAI
- URI de MongoDB (opcional)

### Instalación Manual

Si prefieres realizar la instalación manualmente, sigue estos pasos:

1. Clonar el repositorio:
```bash
git clone https://github.com/pogjester/tavily-company-research.git
cd tavily-company-research
```

2. Instalar dependencias de backend:
```bash
# Opcional: Crear y activar entorno virtual
curl -Ls https://astral.sh/uv/install.sh | sh

# Crear y activar un entorno virtual con uv
uv venv .venv
source .venv/bin/activate

# Instalar dependencias de Python
uv pip install -r requirements.txt

# Alternativamente, puedes usar las herramientas estándar de Python:
# python -m venv .venv
# pip install -r requirements.txt
```

3. Instalar dependencias de frontend:
```bash
cd ui
npm install
```

4. Crear un archivo `.env` con tus claves API:
```env
TAVILY_API_KEY=tu_clave_tavily
GEMINI_API_KEY=tu_clave_gemini
OPENAI_API_KEY=tu_clave_openai

# Opcional: Habilitar persistencia en MongoDB
# MONGODB_URI=tu_cadena_de_conexion_mongodb
```

### Instalación con Docker

La aplicación puede ejecutarse utilizando Docker y Docker Compose:

1. Clonar el repositorio:
```bash
git clone https://github.com/pogjester/tavily-company-research.git
cd tavily-company-research
```

2. Crear un archivo `.env` con tus claves API:
```env
TAVILY_API_KEY=tu_clave_tavily
GEMINI_API_KEY=tu_clave_gemini
OPENAI_API_KEY=tu_clave_openai

# Opcional: Habilitar persistencia en MongoDB
# MONGODB_URI=tu_cadena_de_conexion_mongodb
```

3. Construir e iniciar los contenedores:
```bash
docker compose up --build
```

Esto iniciará los servicios de backend y frontend:
- La API de backend estará disponible en `http://localhost:8000`
- El frontend estará disponible en `http://localhost:5174`

Para detener los servicios:
```bash
docker compose down
```

Nota: Al actualizar las variables de entorno en `.env`, necesitarás reiniciar los contenedores:
```bash
docker compose down && docker compose up
```

### Ejecutando la Aplicación

1. Iniciar el servidor de backend (elige una opción):
```bash
# Opción 1: Módulo Python Directo (usando uv)
uv run python -m application.py

# Opción 2: FastAPI con Uvicorn
uv run uvicorn application:app --reload --port 8000
```

2. En una nueva terminal, iniciar el frontend:
```bash
cd ui
npm run dev
```

3. Acceder a la aplicación en `http://localhost:5173`

## Uso

### Desarrollo Local

1. Iniciar el servidor de backend (elige una opción):

   **Opción 1: Módulo Python Directo (usando uv)**
   ```bash
   uv run python -m application.py
   ```

   **Opción 2: FastAPI con Uvicorn**
   ```bash
   # Instalar uvicorn si aún no está instalado
   uv pip install uvicorn

   # Ejecutar la aplicación FastAPI con recarga automática
   uv run uvicorn application:app --reload --port 8000
   ```

   El backend estará disponible en:
   - Punto de conexión API: `http://localhost:8000`
   - Punto de conexión WebSocket: `ws://localhost:8000/research/ws/{job_id}`

2. Iniciar el servidor de desarrollo del frontend:
   ```bash
   cd ui
   npm run dev
   ```

3. Acceder a la aplicación en `http://localhost:5173`

### Opciones de Despliegue

La aplicación puede desplegarse en varias plataformas en la nube. Aquí hay algunas opciones comunes:

#### AWS Elastic Beanstalk

1. Instalar el EB CLI:
   ```bash
   uv pip install awsebcli
   ```

2. Inicializar la aplicación EB:
   ```bash
   eb init -p python-3.11 tavily-research
   ```

3. Crear y desplegar:
   ```bash
   eb create tavily-research-prod
   ```

#### Otras Opciones de Despliegue

- **Docker**: La aplicación incluye un Dockerfile para despliegue en contenedores
- **Heroku**: Despliegue directamente desde GitHub con el buildpack de Python
- **Google Cloud Run**: Adecuado para despliegue en contenedores con escalado automático

Elige la plataforma que mejor se adapte a tus necesidades. La aplicación es independiente de la plataforma y puede alojarse en cualquier lugar que admita aplicaciones web Python.

## Contribuir

1. Haz un fork del repositorio
2. Crea una rama de características (`git checkout -b feature/caracteristica-increible`)
3. Haz commit de tus cambios (`git commit -m 'Añadir característica increíble'`)
4. Haz push a la rama (`git push origin feature/caracteristica-increible`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## Agradecimientos

- [Tavily](https://tavily.com/) por la API de investigación
- Todas las demás bibliotecas de código abierto y sus contribuyentes

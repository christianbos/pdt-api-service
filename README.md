# PDT Card Grading API

API REST para sistema de gradeo de cartas Pokémon con panel de administración.

## Características

- ✅ API REST completa con autenticación por API Key
- ✅ CRUD de cartas con estructura completa de gradeo
- ✅ Búsqueda por `certificationNumber` (único)
- ✅ Subida de imágenes a Cloudinary
- ✅ Importación masiva desde Excel
- ✅ Panel de administración web simple
- ✅ Base de datos Firestore
- ✅ Validaciones completas con Zod

## Estructura de la API

### Endpoints principales

```
GET    /api/cards                           # Listar cartas (paginado)
POST   /api/cards                           # Crear carta
GET    /api/cards/{certificationNumber}     # Obtener carta por certificationNumber
PUT    /api/cards/{certificationNumber}     # Actualizar carta
DELETE /api/cards/{certificationNumber}     # Eliminar carta

POST   /api/cards/import                    # Importar desde Excel
GET    /api/cards/import                    # Descargar plantilla Excel
POST   /api/cards/{certificationNumber}/images  # Subir imágenes
```

### Panel de Administración

```
/admin                                      # Dashboard principal
/admin/cards/new                           # Crear nueva carta
/admin/cards/{certificationNumber}/edit   # Editar carta
/admin/import                              # Importar Excel
```

## Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=tu-service-account@project.iam.gserviceaccount.com

# API Security
API_SECRET_KEY=tu-clave-secreta-muy-segura

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Admin Panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu-password-seguro

# Frontend
NEXT_PUBLIC_API_KEY=tu-clave-secreta-muy-segura
```

### 2. Instalación

```bash
npm install
```

### 3. Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:
- API: `http://localhost:3000/api`
- Admin Panel: `http://localhost:3000/admin`

## Uso de la API

### Autenticación

Todas las llamadas a la API requieren header:
```
x-api-key: tu-clave-secreta
```

### Ejemplo de carta completa

```json
{
  "name": "Regigigas Vstar",
  "set": "CROWN ZENITH", 
  "number": "#114",
  "year": "2023",
  "rarity": "ULTRA RARE",
  "finalGrade": 10,
  "certificationNumber": 10,
  "version": 1,
  "has3DScan": false,
  "surface": {
    "finalScore": 9.5,
    "bent": 10,
    "bentWeight": null,
    "front": {
      "color": 9.5,
      "scratches": 9.5,
      "colorWeight": 0.3,
      "scratchesWeight": 0.7,
      "totalWeight": 0.45
    },
    "back": {
      "color": 9.5,
      "scratches": 9.5,
      "colorWeight": 0.3,
      "scratchesWeight": 0.7,
      "totalWeight": 0.45
    }
  },
  "edges": {
    "finalScore": 10,
    "frontWeight": 0.6,
    "backWeight": 0.4,
    "front": {
      "left": 10,
      "top": 10,
      "right": 10,
      "bottom": 10
    },
    "back": {
      "left": 10,
      "top": 10,
      "right": 10,
      "bottom": 10
    }
  },
  "corners": {
    "finalScore": 10,
    "frontWeight": 0.6,
    "backWeight": 0.4,
    "front": {
      "topLeft": 10,
      "topRight": 10,
      "bottomLeft": 10,
      "bottomRight": 10
    },
    "back": {
      "topLeft": 10,
      "topRight": 10,
      "bottomLeft": 10,
      "bottomRight": 10
    }
  },
  "centering": {
    "frontScore": 9.5,
    "backScore": 9.5,
    "finalScore": 9.5,
    "front": {
      "left": 9.5,
      "top": 9.5
    },
    "back": {
      "left": 9.5,
      "top": 9.5
    }
  }
}
```

## Importación desde Excel

1. Descargar plantilla desde `/api/cards/import` (GET)
2. Completar plantilla con datos de cartas
3. Subir archivo a `/api/cards/import` (POST)

## Despliegue

### Vercel (Recomendado)

1. Conecta el repositorio a Vercel
2. Configura las variables de entorno
3. Despliega

### Docker (Alternativo)

```bash
# Construir imagen
docker build -t pdt-backend .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env pdt-backend
```

## Tecnologías

- **Next.js 14+** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Firestore** - Base de datos NoSQL
- **Cloudinary** - Almacenamiento de imágenes
- **Zod** - Validación de esquemas
- **Tailwind CSS** - Estilos del admin panel
- **xlsx** - Procesamiento de archivos Excel

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/cards/          # Endpoints de la API
│   ├── admin/              # Panel de administración
│   └── globals.css
├── lib/
│   ├── firebase.ts         # Configuración Firestore
│   ├── cardService.ts      # Lógica de negocio
│   ├── cloudinary.ts       # Servicio de imágenes
│   ├── auth.ts            # Autenticación
│   ├── validations.ts      # Esquemas Zod
│   └── excelImport.ts     # Importación Excel
├── types/
│   └── card.ts            # Tipos TypeScript
└── components/
    └── CardForm.tsx       # Formulario de cartas
```

## Seguridad

- ✅ API Key requerida para todos los endpoints
- ✅ Validación de entrada con Zod
- ✅ Variables de entorno para credenciales
- ✅ Índice único en certificationNumber
- ✅ Manejo seguro de archivos

## Soporte

Para problemas o preguntas, revisa la documentación de la API o los logs del servidor.
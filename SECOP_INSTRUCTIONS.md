# SECOP II - Agente de Monitoreo de Licitaciones

## Descripción del Proyecto

Construir un sistema automatizado (Agentic Agent) para monitorear licitaciones y procesos de contratación pública en Colombia a través de la plataforma SECOP II. El sistema debe:

1. **Buscar automáticamente** procesos de contratación relevantes para una empresa contratista
2. **Analizar cada oportunidad** usando IA para evaluar relevancia, riesgos y estrategia
3. **Generar reportes** diarios/semanales por email con las oportunidades encontradas
4. **Preparar borradores** de documentos de licitación
5. **Proveer links directos** a SECOP II para que un humano haga la postulación final

## Fuente de Datos Principal

La API pública de **Datos Abiertos de Colombia** (SODA API) expone los procesos de SECOP II:

- **URL base**: `https://www.datos.gov.co/resource/p6dx-8zbt.json`
- **Dataset**: SECOP II - Procesos de Contratación
- **Documentación SODA API**: https://dev.socrata.com/docs/queries/
- **Rate limit**: ~1000 requests/hora sin token, más con app token (gratis)
- **Formato**: JSON
- **Tipo de acceso**: Solo lectura (NO se pueden enviar ofertas por API)

Ejemplo de query:
```
GET https://www.datos.gov.co/resource/p6dx-8zbt.json?$where=fecha_de_publicacion > '2026-03-01T00:00:00' AND descripcion_del_procedimiento like '%consultoria%'&$limit=50&$order=fecha_de_publicacion DESC
```

También existe el dataset de contratos electrónicos:
- **URL**: `https://www.datos.gov.co/resource/jbjy-vk9h.json`

## IMPORTANTE - Limitaciones Técnicas y Legales

1. **NO existe API para postularse/enviar ofertas** en SECOP II. La postulación SOLO se puede hacer manualmente en la interfaz web (community.secop.gov.co)
2. La plataforma web usa **Google reCAPTCHA** — no se debe intentar automatizar el envío
3. SECOP II requiere **certificados digitales** y sesiones autenticadas para enviar ofertas
4. Automatizar el envío de ofertas podría violar la **Ley 80 de 1993** y **Ley 1150 de 2007** de contratación pública colombiana
5. El sistema debe generar **links directos** al proceso en SECOP II para que un humano revise y envíe

## Stack Tecnológico

- **Runtime**: Node.js 20+ con TypeScript
- **Framework**: Next.js (App Router) para API + interfaz web opcional
- **Base de datos**: PostgreSQL 14+ con Prisma ORM
- **IA**: Anthropic Claude SDK (`@anthropic-ai/sdk`)
- **Email**: Resend (transactional email)
- **Scheduling**: node-cron para jobs automáticos
- **Validación**: Zod

## Arquitectura del Sistema

```
SecopSearchProfile (criterios de búsqueda)
    ↓
SecopAdapter (consulta SODA API de datos.gov.co)
    ↓
SecopFetchService (orquesta búsquedas, deduplica)
    ↓
SecopOpportunity (almacena en BD)
    ↓
OpportunityAnalysisService (Claude analiza relevancia)
    ↓
SecopReportService (genera reporte HTML)
    ↓
EmailService (envía por email)
```

---

## MODELOS DE BASE DE DATOS (Prisma)

### Enums

```prisma
enum OpportunityStatus {
  NEW          // Recién encontrada
  REVIEWED     // Vista por un humano
  INTERESTED   // La empresa quiere postularse
  PREPARING    // Preparando documentos
  SUBMITTED    // Se postuló manualmente en SECOP
  DISCARDED    // No relevante
  EXPIRED      // Fecha de cierre pasada
}

enum FetchLogStatus {
  RUNNING
  SUCCESS
  PARTIAL
  FAILED
}

enum ReportStatus {
  GENERATING
  READY
  SENDING
  SENT
  FAILED
}
```

### Modelos

```prisma
model SecopSearchProfile {
  id             String   @id @default(uuid())
  name           String   // ej: "Consultoría TI", "Obra civil Bogotá"
  keywords       String[] // ej: ["software", "desarrollo", "TI"]
  unspscCodes    String[] // Códigos UNSPSC (clasificación ONU usada por SECOP)
  minBudget      Decimal? // Presupuesto mínimo en COP
  maxBudget      Decimal? // Presupuesto máximo en COP
  entities       String[] // Entidades gubernamentales específicas
  departamentos  String[] // Departamentos de Colombia
  processTypes   String[] // "Licitacion Publica", "Seleccion Abreviada", "Minima Cuantia", etc.
  enabled        Boolean  @default(true)
  config         Json     @default("{}")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  opportunities  SecopOpportunity[]
  fetchLogs      SecopFetchLog[]
}

model SecopOpportunity {
  id              String            @id @default(uuid())
  secopId         String            @unique // ID del proceso en datos.gov.co
  title           String
  description     String?           @db.Text
  entity          String            // Entidad compradora
  entityNit       String?
  processType     String            // Tipo de proceso
  status          OpportunityStatus @default(NEW)
  secopStatus     String            // Estado en SECOP (Borrador, Publicado, Adjudicado, etc.)
  budget          Decimal?          // Presupuesto base en COP
  currency        String            @default("COP")
  publishDate     DateTime?
  closingDate     DateTime?         // Fecha límite para postularse
  secopUrl        String            // Link directo al proceso en SECOP II
  department      String?           // Departamento
  municipality    String?           // Municipio
  unspscCode      String?
  contactInfo     Json?
  rawData         Json              // Respuesta completa de la API
  aiAnalysis      Json?             // Análisis generado por Claude
  relevanceScore  Int               @default(0) // 0-100
  userNotes       String?           @db.Text
  dedupHash       String            @unique
  searchProfileId String
  fetchedAt       DateTime
  analyzedAt      DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  searchProfile   SecopSearchProfile @relation(fields: [searchProfileId], references: [id])
  documents       SecopDocument[]

  @@index([status])
  @@index([closingDate])
  @@index([relevanceScore(sort: Desc)])
  @@index([searchProfileId, fetchedAt(sort: Desc)])
  @@index([secopStatus])
}

model SecopDocument {
  id             String   @id @default(uuid())
  opportunityId  String
  name           String   // ej: "Carta de presentación"
  type           String   // "cover_letter", "experience_cert", "budget_proposal"
  content        String   @db.Text
  metadata       Json     @default("{}")
  createdAt      DateTime @default(now())

  opportunity    SecopOpportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
}

model SecopFetchLog {
  id                String         @id @default(uuid())
  searchProfileId   String
  startedAt         DateTime       @default(now())
  completedAt       DateTime?
  opportunitiesFound Int           @default(0)
  opportunitiesNew   Int           @default(0)
  errors            Json           @default("[]")
  status            FetchLogStatus @default(RUNNING)
  queryParams       Json           // Parámetros SoQL usados

  searchProfile     SecopSearchProfile @relation(fields: [searchProfileId], references: [id])

  @@index([searchProfileId, startedAt(sort: Desc)])
}

model SecopReport {
  id              String       @id @default(uuid())
  date            DateTime     @unique @db.Date
  subject         String
  htmlContent     String       @db.Text
  jsonContent     Json
  status          ReportStatus @default(GENERATING)
  opportunityIds  String[]
  sentTo          String[]
  sentAt          DateTime?
  createdAt       DateTime     @default(now())
}
```

---

## SERVICIOS A IMPLEMENTAR

### 1. SecopAdapter (`src/services/adapters/SecopAdapter.ts`)

Responsabilidades:
- Construir queries SoQL desde un `SecopSearchProfile`
- Llamar a `https://www.datos.gov.co/resource/p6dx-8zbt.json`
- Parsear respuesta JSON a interfaz `RawOpportunity`
- Manejar paginación ($limit, $offset)
- Incluir `X-App-Token` header si disponible (env var)
- Construir URL de SECOP II: `https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.{secopId}`

Interface de salida:
```typescript
interface RawOpportunity {
  secopId: string;
  title: string;
  description?: string;
  entity: string;
  entityNit?: string;
  processType: string;
  secopStatus: string;
  budget?: number;
  publishDate?: Date;
  closingDate?: Date;
  department?: string;
  municipality?: string;
  unspscCode?: string;
  contactInfo?: Record<string, unknown>;
  secopUrl: string;
  rawData: Record<string, unknown>;
}
```

Campos clave del dataset SODA que mapear (nombres pueden variar, verificar con la API):
- `nombre_del_procedimiento` → title
- `descripcion_del_procedimiento` → description
- `nombre_de_la_entidad` → entity
- `nit_de_la_entidad` → entityNit
- `tipo_de_proceso` → processType
- `estado_del_procedimiento` → secopStatus
- `precio_base` → budget
- `fecha_de_publicacion` → publishDate
- `fecha_de_cierre` → closingDate
- `departamento` → department
- `municipio` → municipality
- `codigo_unspsc` → unspscCode

### 2. SecopFetchService (`src/services/SecopFetchService.ts`)

- `fetchAll()`: Itera todos los perfiles activos, ejecuta búsqueda
- `fetchProfile(profileId)`: Búsqueda individual, crea FetchLog
- Deduplicación: SHA256 hash del `secopId`
- Oportunidades nuevas → status `NEW`
- Oportunidades existentes → actualiza `secopStatus` y `closingDate` si cambiaron
- Procesamiento secuencial (respetar rate limits)

### 3. OpportunityAnalysisService (`src/services/OpportunityAnalysisService.ts`)

- `analyzeOpportunity(id)`: Envía datos a Claude para evaluación
- `analyzeNewBatch()`: Analiza todas las oportunidades con status NEW sin `aiAnalysis`
- Usa `SECOP_COMPANY_PROFILE` como contexto del prompt

Prompt para Claude:
```
Eres un analista de contratación pública colombiana. Analiza esta oportunidad
de licitación para la empresa descrita a continuación y proporciona tu evaluación.

PERFIL DE LA EMPRESA:
{SECOP_COMPANY_PROFILE}

OPORTUNIDAD:
Título: {title}
Entidad: {entity}
Tipo de proceso: {processType}
Presupuesto: {budget} COP
Fecha de cierre: {closingDate}
Descripción: {description}
Departamento: {department}

Responde en JSON con esta estructura:
{
  "relevanceScore": 0-100,
  "summary": "Resumen breve de la oportunidad",
  "requirements": ["Requisito 1", "Requisito 2"],
  "risks": ["Riesgo 1", "Riesgo 2"],
  "bidStrategy": "Estrategia sugerida para la propuesta",
  "estimatedEffort": "Estimación de recursos necesarios",
  "requiredDocuments": ["Documento 1", "Documento 2"],
  "recommendation": "PURSUE | CONSIDER | SKIP",
  "reasoning": "Explicación de la recomendación"
}
```

### 4. SecopDocumentService (`src/services/SecopDocumentService.ts`)

- `generateTemplates(opportunityId)`: Genera borradores usando Claude
- Tipos de documentos: carta de presentación, certificación de experiencia, propuesta económica
- Almacena como `SecopDocument`

### 5. SecopReportService (`src/services/SecopReportService.ts`)

- `generateDailyReport()`: Oportunidades de las últimas 24h, alta relevancia, próximas a cerrar
- `generateWeeklyReport()`: Resumen semanal con estadísticas
- `sendReport(report)`: Envía via Resend a `SECOP_REPORT_EMAILS`
- HTML del reporte incluye: tabla de oportunidades, links directos a SECOP II, análisis IA resumido, alertas de cierre próximo

---

## RUTAS API

```
POST   /api/secop/profiles          — Crear perfil de búsqueda
GET    /api/secop/profiles          — Listar perfiles
GET    /api/secop/profiles/:id      — Ver perfil
PUT    /api/secop/profiles/:id      — Editar perfil
DELETE /api/secop/profiles/:id      — Eliminar perfil

GET    /api/secop/opportunities          — Listar (filtros: status, profileId, minRelevance, closingBefore, search, page, limit)
GET    /api/secop/opportunities/:id      — Ver detalle
PATCH  /api/secop/opportunities/:id      — Actualizar estado/notas
POST   /api/secop/opportunities/:id/analyze    — Disparar análisis IA
GET    /api/secop/opportunities/:id/documents  — Ver documentos generados
POST   /api/secop/opportunities/:id/documents  — Generar documentos

GET    /api/secop/reports           — Listar reportes
POST   /api/secop/reports           — Generar reporte manual
GET    /api/secop/reports/:id       — Ver reporte

POST   /api/secop/fetch             — Disparar búsqueda manual (admin)
```

---

## CRON JOBS (Worker)

| Job | Cron (UTC) | Hora Colombia | Descripción |
|-----|-----------|---------------|-------------|
| Fetch | `0 */4 * * *` | Cada 4 horas | Buscar nuevas licitaciones |
| Analysis | `30 */4 * * *` | 30 min después | Analizar oportunidades nuevas con IA |
| Daily Report | `0 13 * * 1-5` | 8:00 AM L-V | Reporte diario por email |
| Expiry Check | `0 12 * * *` | 7:00 AM diario | Marcar oportunidades expiradas |
| Weekly Report | `0 14 * * 1` | 9:00 AM lunes | Resumen semanal |

---

## VARIABLES DE ENTORNO

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/secop_agent?schema=public

# Anthropic (para análisis IA)
ANTHROPIC_API_KEY=sk-ant-...

# Datos Abiertos Colombia
SECOP_SODA_BASE_URL=https://www.datos.gov.co/resource/p6dx-8zbt.json
SECOP_SODA_APP_TOKEN=           # Opcional, aumenta rate limit (registrar gratis en datos.gov.co)

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=licitaciones@tuempresa.co

# Configuración empresa
SECOP_REPORT_EMAILS=gerente@empresa.co,legal@empresa.co
SECOP_COMPANY_PROFILE={"name":"Tu Empresa S.A.S.","nit":"900123456-7","services":["Consultoría en TI","Desarrollo de software","Soporte técnico"],"experience":"10 años en proyectos gubernamentales","certifications":["ISO 9001","ISO 27001"],"maxBudget":"500000000","preferredRegions":["Bogotá","Cundinamarca"]}

# Auth
JWT_SECRET=tu-secreto-jwt

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ORDEN DE IMPLEMENTACIÓN

1. Inicializar proyecto Next.js + TypeScript + Prisma + PostgreSQL
2. Definir schema Prisma con todos los modelos → ejecutar migración
3. Implementar `SecopAdapter` — probar consultas a la SODA API
4. Implementar `SecopFetchService` — verificar que guarda oportunidades
5. Crear rutas API de profiles y opportunities
6. Implementar `OpportunityAnalysisService` con Claude
7. Implementar `SecopReportService` + integración con Resend
8. Configurar cron jobs en worker.ts
9. Implementar `SecopDocumentService`
10. Crear rutas API restantes (documents, reports, fetch manual)

---

## FLUJO COMPLETO DEL SISTEMA

1. Admin crea un `SecopSearchProfile` con keywords: `["desarrollo software", "plataforma web", "consultoría TI"]`, departamentos: `["Bogotá D.C."]`, minBudget: `50000000`
2. Cada 4 horas, el worker ejecuta `SecopFetchService.fetchAll()`
3. El adapter consulta la SODA API con filtros SoQL construidos desde el perfil
4. Las oportunidades nuevas se guardan con status `NEW`
5. 30 minutos después, `OpportunityAnalysisService` analiza cada una con Claude
6. Claude asigna relevanceScore y recomendación (PURSUE/CONSIDER/SKIP)
7. A las 8 AM (Colombia), se genera y envía el reporte diario por email
8. El reporte incluye: oportunidades nuevas de alta relevancia, links directos a SECOP II, resumen del análisis IA
9. Un humano revisa el reporte, entra a SECOP II con los links, y se postula manualmente
10. El humano actualiza el status en el sistema (INTERESTED → PREPARING → SUBMITTED)
11. Si marca como INTERESTED, puede generar borradores de documentos con IA

---

## RECURSOS Y REFERENCIAS

- API SODA (Socrata): https://dev.socrata.com/docs/queries/
- Dataset SECOP II Procesos: https://www.datos.gov.co/Gastos-Gubernamentales/SECOP-II-Procesos-de-Contrataci-n/p6dx-8zbt
- Dataset SECOP II Contratos: https://www.datos.gov.co/Estad-sticas-Nacionales/SECOP-II-Contratos-Electr-nicos/jbjy-vk9h
- Colombia Compra Eficiente: https://www.colombiacompra.gov.co/secop/secop-ii
- Guía proveedores SECOP II: https://www.colombiacompra.gov.co/secop/secop-ii/como-usar-el-secop-ii-proveedores
- Anthropic Claude SDK: https://docs.anthropic.com/en/docs
- Resend Email API: https://resend.com/docs
- Prisma ORM: https://www.prisma.io/docs

# StarMotos | Portal de Seguimiento & Hoja de Vida para Clientes

Portal web de autoservicio para clientes de talleres mecánicos de motocicletas con soporte multi-sucursal (**Matriz Central** y **Taller Norte**). 
Permite al cliente final consultar en tiempo real el progreso de su orden de trabajo (OT), revisar la inspección 360° de recepción con fotos y firma digital, autorizar presupuestos técnicos con desglose contable e IVA del 15% (Ecuador), revisar su historial de mantenimientos y consultar garantías activas.

🌐 **URL Desplegada en Producción (Firebase Hosting):**  
[https://starmotos-portal.web.app](https://starmotos-portal.web.app)

---

## 🛠️ Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite
- **Estilos & Diseño:** Tailwind CSS (Paleta automotriz Zinc/Slate con acentos Ámbar y Esmeralda)
- **Iconos:** Lucide React
- **Interactividad:** Canvas Confetti (celebración tras aprobación)
- **Hosting & CI/CD:** Firebase Hosting + GitHub Actions

---

## 📁 Arquitectura Modular de Archivos

```tree
starmotos/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml    # CI/CD automatizado push-to-deploy
├── src/
│   ├── types/
│   │   └── customer.ts           # Interfaces TypeScript completas (Vehículo, OT, 360°, Cotización, etc.)
│   ├── hooks/
│   │   └── useCustomerPortal.ts  # Hook con lógica de negocio reactiva, mock data y estados
│   ├── components/
│   │   ├── CustomerViewMobile.tsx  # Vista exclusiva móvil (App-like, barra sticky, tabs)
│   │   └── CustomerViewDesktop.tsx # Vista escritorio (Dashboard de 3 columnas, proforma SRI)
│   ├── CustomerPortal.tsx        # Orquestador con selector responsivo y modales
│   ├── App.tsx                   # Componente raíz
│   ├── main.tsx                  # Punto de entrada
│   └── index.css                 # Configuración Tailwind y estilos de impresión
├── firebase.json                 # Reglas de Firebase Hosting con rewrite SPA
├── .firebaserc                   # Configuración del proyecto starmotos-portal
└── package.json
```

---

## 🚀 Características Principales

### 1. Header con Matrícula Ecuatoriana & Ficha del Vehículo
- Visualización de la placa con formato oficial ecuatoriano (tricolor nacional y tipografía condensada).
- Marca, modelo, cilindraje, odómetro actual y año.
- Medidor gráfico de combustible (E, 1/4, 1/2, 3/4, F).

### 2. Inspección de Ingreso (Check-in 360°)
- 5 fotografías de recepción obligatorias: Frontal, Lateral Izq., Lateral Der., Trasera y Tablero.
- Checklist de novedades y daños previos con clasificación de severidad (Leve, Moderado, Grave) y notas del asesor.
- Firma digital de recepción del cliente registrada con timestamp.

### 3. Orden de Trabajo (OT) & Stepper de 7 Fases
- `[Recepción] -> [En Diagnóstico] -> [Cotización Pendiente] -> [En Reparación] -> [Control de Calidad] -> [Lista para Retiro] -> [Entregada]`
- Evidencia fotográfica de diagnóstico subida por el mecánico asignado (cadena, bujías, pastillas de freno) con visor lightbox en alta resolución.
- Ficha del mecánico asignado con especialidad y asesor de servicio.

### 4. Presupuesto & Desglose Financiero (SRI Ecuador)
- Desglose entre repuestos/fluidos y mano de obra/servicios.
- Cálculo de subtotal, descuento por fidelidad, IVA del 15% y total a pagar en USD.
- **Botón interactivo "Aprobar Presupuesto"**: Modal de confirmación que actualiza el estado de la cotización a `Aprobado`, traslada la orden de trabajo a `En Reparación` y lanza animación festiva con confetti.

### 5. Retiro y Enlace Directo a WhatsApp / Google Maps
- Cuando la motocicleta está en estado `Lista para Retiro`, se despliega un banner destacado en verde esmeralda con enlace directo a la ubicación de la sucursal en Google Maps y botón preconfigurado de WhatsApp.

### 6. Demo Bar para Pruebas UX
- Permite alternar fácilmente entre vista Móvil y Escritorio forzada.
- Permite conmutar entre 3 escenarios reales de taller:
  1. **Benelli TRK 502X:** Estado `Cotización Pendiente` (ideal para probar la aprobación de presupuesto).
  2. **Yamaha MT-03:** Estado `En Reparación`.
  3. **Honda CB190R:** Estado `¡Lista para Retiro!`.

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

---

## ☁️ Despliegue en Firebase Hosting

```bash
# Despliegue directo
firebase deploy --only hosting
```

# KASETA - Sistema de Control de Acceso Universal

## IMPORTANTE: Estándar de Calidad Tier S

Esta app debe sentirse **premium, pulida, de clase mundial**. El nivel de calidad objetivo es el de apps como Linear, Airbnb, Uber, Revolut. No se acepta nada que se sienta "genérico" o "hecho por IA".

## Stack Tecnológico
- **Frontend**: Expo / React Native con Expo Router
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime)
- **Notificaciones**: Expo Push Notifications
- **Almacenamiento**: Supabase Storage

---

## Paleta de Colores

```typescript
const colors = {
  // Core
  primary: '#18181B',      // zinc-900 - Negro principal
  accent: '#FACC15',       // yellow-400 - Amarillo eléctrico (CTAs, badges, highlights)

  // Grays
  secondary: '#A1A1AA',    // zinc-400
  muted: '#71717A',        // zinc-500
  subtle: '#D4D4D8',       // zinc-300

  // Backgrounds
  background: '#FFFFFF',   // Blanco puro
  surface: '#F4F4F5',      // zinc-100 - Cards, inputs
  surfaceHover: '#E4E4E7', // zinc-200

  // Text
  text: '#18181B',         // zinc-900
  textSecondary: '#52525B', // zinc-600
  textMuted: '#A1A1AA',    // zinc-400
  textOnAccent: '#18181B', // Negro sobre amarillo

  // Semantic
  success: '#22C55E',      // green-500
  successBg: '#F0FDF4',    // green-50
  error: '#EF4444',        // red-500
  errorBg: '#FEF2F2',      // red-50
  warning: '#F59E0B',      // amber-500
  warningBg: '#FFFBEB',    // amber-50
  info: '#3B82F6',         // blue-500
  infoBg: '#EFF6FF',       // blue-50

  // Dark Mode
  dark: {
    background: '#09090B',   // zinc-950
    surface: '#18181B',      // zinc-900
    surfaceHover: '#27272A', // zinc-800
    text: '#FAFAFA',         // zinc-50
    textSecondary: '#A1A1AA', // zinc-400
    border: '#27272A',       // zinc-800
  }
};
```

---

## Principios de Diseño Tier S

### 1. Microinteracciones en TODO
```typescript
// Cada botón, card, input debe tener feedback táctil
<Pressable
  onPressIn={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97);
  }}
  onPressOut={() => {
    scale.value = withSpring(1);
  }}
>
```

### 2. Animaciones Suaves (60fps)
- Usar `react-native-reanimated` para TODAS las animaciones
- `withSpring()` para interacciones, `withTiming()` para transiciones
- Duración típica: 200-300ms
- Easing: `Easing.bezierFn(0.25, 0.1, 0.25, 1)` (ease-out)

### 3. Skeleton Loaders, NUNCA spinners solos
```typescript
// MAL
{loading && <ActivityIndicator />}

// BIEN
{loading ? <InvitationCardSkeleton /> : <InvitationCard data={data} />}
```

### 4. Tipografía con Jerarquía Clara
```typescript
const typography = {
  // Headings
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },

  // Body
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  bodySm: { fontSize: 14, fontWeight: '400', lineHeight: 20 },

  // UI
  label: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },

  // Mono (para códigos, QR)
  mono: { fontFamily: 'SpaceMono', fontSize: 14 },
};
```

### 5. Espaciado Consistente (8pt grid)
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### 6. Bordes y Sombras Sutiles
```typescript
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};

const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
```

### 7. Feedback Visual Inmediato
- Botón presionado: escala 0.97 + haptic
- Éxito: checkmark animado + haptic success
- Error: shake animation + haptic error
- Pull to refresh: custom animation (no el default)

### 8. Detalles que Importan
- Iconos: Lucide icons (consistentes, 24px)
- Bordes: 1px con color `zinc-200` (light) o `zinc-800` (dark)
- Focus states visibles para accesibilidad
- Respeto al safe area en todos los dispositivos
- Soporte para Dynamic Type (accesibilidad iOS)

---

## Componentes Base Requeridos

```
components/ui/
├── Button.tsx          # Variants: primary (amarillo), secondary, ghost, destructive
├── Input.tsx           # Con label, error state, helper text
├── Card.tsx            # Con shadow, hover state, pressable variant
├── Badge.tsx           # Status badges con colores semánticos
├── Avatar.tsx          # Con fallback a iniciales
├── Skeleton.tsx        # Para loading states
├── Toast.tsx           # Notificaciones in-app
├── BottomSheet.tsx     # Para modales y selects
├── EmptyState.tsx      # Para listas vacías
├── IconButton.tsx      # Botones solo icono con haptic
├── Divider.tsx         # Separadores sutiles
└── Text.tsx            # Componente de texto con variants
```

---

## Estructura del Proyecto

```
kaseta/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (app)/                    # Main app (authenticated)
│   │   ├── (tabs)/               # Tab navigation
│   │   │   ├── _layout.tsx       # Dynamic tabs based on org type & role
│   │   │   ├── home.tsx
│   │   │   ├── invitations/
│   │   │   ├── scan.tsx
│   │   │   └── profile.tsx
│   │   ├── invitation/[id].tsx
│   │   ├── access-log/[id].tsx
│   │   └── settings/
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
├── components/
│   ├── ui/                       # Base UI components
│   ├── features/                 # Feature-specific components
│   │   ├── invitations/
│   │   ├── access-log/
│   │   ├── vehicles/
│   │   └── amenities/
│   └── layout/                   # Layout components
├── hooks/
│   ├── useAuth.ts
│   ├── useOrganization.ts
│   ├── useFeature.ts
│   └── useNotifications.ts
├── lib/
│   ├── supabase.ts
│   ├── notifications.ts
│   └── qr.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── OrganizationContext.tsx
│   └── ModulesContext.tsx
├── types/
│   ├── database.ts               # Generated from Supabase
│   ├── navigation.ts
│   └── index.ts
├── constants/
│   ├── Colors.ts
│   ├── Typography.ts
│   ├── Spacing.ts
│   ├── Shadows.ts
│   └── Animations.ts
└── utils/
    ├── terminology.ts
    └── permissions.ts
```

---

## Verticales Soportadas

```typescript
type OrganizationType =
  | 'residential'   // Fraccionamientos, condominios
  | 'corporate'     // Oficinas, coworkings
  | 'educational'   // Escuelas, universidades
  | 'industrial'    // Plantas, fábricas, bodegas
  | 'healthcare'    // Hospitales, clínicas
  | 'events';       // Conciertos, bodas, conferencias
```

---

## Roles y Permisos

```typescript
const roles = {
  super_admin: 'Todo acceso',
  admin: 'Gestión de usuarios, guardias, unidades',
  resident: 'Crear invitaciones para su unidad',
  guard: 'Escanear QR, registrar accesos',
};
```

---

## Ralph Configuration

Este proyecto usa Ralph para desarrollo iterativo. Ver `.ralph/PROMPT.md` para las instrucciones de cada ciclo.

### Comandos
```bash
# Iniciar Ralph
cd /Users/manuelramirez/lovable-audits/Kaseta
ralph --monitor

# Ver progreso
cat .ralph/@progress.md
```

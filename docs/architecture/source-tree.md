# Source Tree Integration

## Existing Project Structure
```plaintext
soyuzcinterface/
├── app/
│   ├── globals.css
│   ├── layout.tsx          # Root layout with ThemeProvider
│   └── page.tsx            # Main entry point with state management
├── components/
│   ├── ui/                 # shadcn/ui components (Radix UI)
│   ├── auth-screen.tsx     # Current simple auth form
│   ├── mini-disc-screen.tsx
│   ├── soft-skills-screen.tsx
│   ├── sjt-screen.tsx
│   └── completion-screen.tsx
├── lib/
│   └── utils.ts            # Utility functions
└── docs/
    ├── PRD_brownfield.md
    └── documentacao_inicial.md
```

## New File Organization
```plaintext
soyuzcinterface/
├── app/
│   ├── api/                           # New API routes
│   │   ├── assessment/
│   │   │   └── route.ts              # Assessment CRUD operations
│   │   ├── assessments/
│   │   │   └── route.ts              # List assessments
│   │   └── profile/
│   │       └── route.ts              # Profile management
│   ├── globals.css
│   ├── layout.tsx                     # Enhanced with AuthProvider
│   └── page.tsx                       # Enhanced with ProtectedRoute
├── components/
│   ├── ui/                           # Existing shadcn/ui components
│   ├── providers/                    # New providers folder
│   │   └── auth-provider.tsx         # Authentication context provider
│   ├── auth/                         # New auth components
│   │   ├── protected-route.tsx       # Route protection HOC
│   │   └── user-profile-manager.tsx  # Profile management component
│   ├── auth-screen.tsx               # Enhanced with Supabase auth
│   ├── mini-disc-screen.tsx          # Enhanced with auto-save
│   ├── soft-skills-screen.tsx        # Enhanced with auto-save
│   ├── sjt-screen.tsx                # Enhanced with auto-save
│   └── completion-screen.tsx         # Enhanced with persistence
├── lib/
│   ├── supabase/                     # New Supabase integration
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client for API routes
│   │   └── types.ts                  # TypeScript definitions
│   ├── services/                     # New services folder
│   │   └── assessment-service.ts     # Assessment persistence service
│   └── utils.ts                      # Existing utilities
└── docs/
    ├── PRD_brownfield.md
    ├── documentacao_inicial.md
    └── architecture.md               # This document
```

## Integration Guidelines
- **File Naming:** Manter convenção kebab-case existente para componentes e arquivos
- **Folder Organization:** Seguir padrão App Router do Next.js, agrupar por funcionalidade (auth/, providers/, services/)
- **Import/Export Patterns:** Manter imports absolutos com @ alias, exports nomeados para services e utilities
# Sistema GAMAN

Plataforma web para automatizar procesos comerciales de una mueblería.

## Objetivo

Sistema GAMAN centraliza en una sola plataforma:

- Revisión de talones
- Generación de Excel/PDF
- Pedidos
- Autorizaciones
- Documentos
- Historial de estados
- Compulsa
- Refinanciamientos
- Saldos
- Reportes
- Bot de Telegram como canal operativo
- Futuro módulo IA/RAG

## Arquitectura

```txt
Sistema GAMAN
├── frontend/   Next.js + TypeScript + TailwindCSS
├── backend/    FastAPI + PostgreSQL + SQLAlchemy
├── bot/        Integración futura con Telegram
├── storage/    Archivos generados y cargados
└── docs/       Documentación técnica


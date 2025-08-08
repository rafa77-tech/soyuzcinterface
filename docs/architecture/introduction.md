# Introduction

This document outlines the architectural approach for enhancing Projeto Soyuz with backend implementation and authentication system using Supabase. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing system.

**Relationship to Existing Architecture:**
This document supplements existing project architecture by defining how new components will integrate with current systems. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

## Existing Project Analysis

**Current Project State**
- **Primary Purpose:** Ferramenta de avaliação de soft skills para médicos implementada como aplicação Next.js frontend-only
- **Current Tech Stack:** Next.js 15.2.4, React 19, TypeScript 5, Tailwind CSS 4.1.9, Radix UI components
- **Architecture Style:** Next.js App Router com estrutura baseada em componentes React modulares
- **Deployment Method:** Configurado para Vercel com build otimizado

**Available Documentation**
- docs/PRD_brownfield.md - Comprehensive product requirements document
- docs/documentacao_inicial.md - Initial brownfield analysis and technical overview
- package.json - Dependencies and build configuration

**Identified Constraints**
- Perda de dados: Resultados perdidos ao fechar navegador - nenhuma persistência
- Ausência de autenticação: auth-screen.tsx apenas coleta dados básicos sem validação
- Estado volátil: Todo progresso da avaliação existe apenas na sessão atual
- Escalabilidade limitada: Arquitetura não suporta múltiplos usuários ou sessões concorrentes

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Architecture | 2025-08-07 | 1.0 | Brownfield enhancement architecture for Supabase integration | Winston |

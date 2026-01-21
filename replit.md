# replit.md

## Overview

This is a mobile exam preparation platform built with Expo (React Native) and Express.js. The application helps students practice Previous Year Questions (PYQs) through topic-wise practice sessions, mock tests, and analytics tracking. Users can practice questions, track their progress across subjects and topics, and identify weak areas for improvement.

The platform supports guest users via device ID authentication and is designed for eventual migration to Supabase for full authentication and direct database access.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: React Native StyleSheet with a custom theme system (light/dark mode support)
- **Animations**: React Native Reanimated for smooth transitions and interactions
- **Path Aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/`

The client follows a clear structure:
- `components/` - Reusable UI components (Button, Card, ThemedText, etc.)
- `screens/` - Screen components for each view
- `navigation/` - Stack and tab navigators
- `hooks/` - Custom hooks for theming, user management, screen options
- `lib/` - Utilities for API requests, storage, and query client
- `constants/` - Theme colors, typography, and spacing definitions

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Schema Sharing**: Database schemas defined in `shared/schema.ts` using Drizzle and validated with Zod

Key API endpoints handle:
- User management (guest creation via deviceId)
- Subject and topic browsing
- Question retrieval and practice sessions
- Answer submission and analytics tracking

### Data Model
Core entities defined in `shared/schema.ts`:
- **Users**: Guest/registered users with stats (streak, questions attempted, accuracy)
- **Subjects/Topics**: Hierarchical content organization
- **Questions**: MCQ, multi-select, and numerical types with difficulty levels
- **Practice Sessions**: Test sessions linking users to questions
- **User Answers**: Individual answer records with timing
- **Topic Analytics**: Per-topic performance tracking
- **Bookmarked Questions**: User saved questions

### Authentication
- Currently uses device-based guest authentication (no password required)
- `deviceId` generated and stored client-side in AsyncStorage
- Future migration planned to Supabase Auth with email, Google, and anonymous auth support

### Build System
- Development: Concurrent Expo Metro bundler + Express server
- Production: esbuild for server bundling, Expo for client static builds
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database via Drizzle ORM
- Connection via `DATABASE_URL` environment variable
- Schema migrations managed through Drizzle Kit

### Client-Side Storage
- **AsyncStorage**: Persists userId, deviceId, language preference, and current session state

### API Communication
- REST API calls from mobile app to Express server
- Base URL configured via `EXPO_PUBLIC_DOMAIN` environment variable
- TanStack Query handles caching, refetching, and request deduplication

### Third-Party Libraries
- **expo-haptics**: Haptic feedback on interactions
- **expo-blur/expo-glass-effect**: iOS blur effects for navigation
- **react-native-svg**: Progress ring visualizations
- **Nunito font**: Custom typography via Expo Google Fonts

### Planned Migration (Supabase)
The project has documentation for migrating to Supabase including:
- Direct database access with Row Level Security
- Supabase Auth for user authentication
- Edge Functions for business logic
- Removal of Express server dependency
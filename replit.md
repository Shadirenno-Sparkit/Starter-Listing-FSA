# Field Assistant - AI-Powered Field Service Management

## Overview

Field Assistant is a comprehensive field service management application designed specifically for gas station maintenance. It combines AI-powered assistance, augmented reality guidance, and mobile-first design to improve technician productivity and service quality.

## User Preferences

Preferred communication style: Simple, everyday language.
AI Assistant Tone: Professional, direct, expert-to-expert communication for petroleum field technicians. Skip basic safety reminders and focus on technical solutions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First**: Responsive design optimized for mobile devices

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with WebSocket support

### Key Components

#### Authentication System
- **Implementation**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **User Management**: Automatic user creation and business association
- **Authorization**: Role-based access control (technician, manager, admin)

#### Database Schema
- **Users**: Profile information, business association, roles, and skill levels
- **Businesses**: Multi-tenant support with subscription tiers
- **Work Orders**: Complete work order lifecycle management
- **AI Conversations**: Chat history and context storage
- **Knowledge Base**: Searchable technical documentation
- **Training Modules**: Interactive training content and progress tracking
- **Media Files**: Image and document storage with metadata

#### AI Services
- **OpenAI Integration**: GPT-4o for chat responses and image analysis
- **Context-Aware Responses**: Work order and user context integration
- **Image Analysis**: Equipment identification and issue detection
- **Voice Processing**: Speech-to-text conversion for hands-free operation

#### External Integrations
- **FieldEdge API**: Work order synchronization and status updates
- **Mock Implementation**: Placeholder for real API integration
- **Bi-directional Sync**: Work orders sync from FieldEdge to local database

### Data Flow

1. **User Authentication**: Replit Auth → OpenID Connect → Session Creation
2. **Work Order Management**: FieldEdge API → Local Database → Frontend
3. **AI Assistance**: User Input → OpenAI API → Context Processing → Response
4. **Image Analysis**: Camera Capture → Base64 Encoding → OpenAI Vision API
5. **Voice Input**: WebRTC → Speech Recognition → Text Processing
6. **Real-time Updates**: WebSocket connections for live updates

### External Dependencies

#### Core Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm, connect-pg-simple
- **Authentication**: openid-client, passport, express-session
- **AI Services**: openai (GPT-4o model)
- **UI Components**: @radix-ui/* components, @tanstack/react-query
- **Development**: vite, typescript, tailwindcss, postcss

#### Browser APIs
- **Camera Access**: MediaDevices.getUserMedia for AR features
- **Speech Recognition**: Web Speech API for voice input
- **WebSocket**: For real-time communication
- **File Upload**: Multer for handling image uploads

### Deployment Strategy

#### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon serverless PostgreSQL (requires DATABASE_URL)
- **Environment Variables**: SESSION_SECRET, OPENAI_API_KEY, REPLIT_DOMAINS
- **Build Process**: TypeScript compilation with esbuild for server, Vite for client

#### Production Deployment
- **Build Command**: `npm run build` - Creates optimized client and server builds
- **Server Bundle**: ESM format with external packages for Node.js deployment
- **Static Assets**: Vite-optimized client build in dist/public
- **Database Migrations**: Drizzle Kit for schema management

#### Key Architectural Decisions

1. **Mobile-First Design**: Chosen for field technician workflow optimization
   - Touch-friendly interface with large buttons
   - Offline-capable progressive web app features
   - Camera and voice input integration

2. **Serverless PostgreSQL**: Neon database for scalability and cost-effectiveness
   - Automatic scaling based on usage
   - Built-in connection pooling
   - Reduced operational overhead

3. **Replit Auth Integration**: Simplified authentication flow
   - OAuth 2.0 / OpenID Connect standard
   - Session management with PostgreSQL storage
   - Multi-tenant business association

4. **AI-First Approach**: OpenAI GPT-4o for intelligent assistance
   - Context-aware responses using work order data
   - Image analysis for equipment diagnostics
   - Voice interface for hands-free operation

5. **Modular Component Architecture**: Radix UI + shadcn/ui for consistency
   - Accessible components by default
   - Customizable with Tailwind CSS
   - Type-safe with TypeScript

6. **Real-time Communication**: WebSocket integration for live updates
   - Work order status changes
   - AI conversation updates
   - Multi-user collaboration features
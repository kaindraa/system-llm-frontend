# System LLM Frontend - Development Context

## Overview
System LLM Frontend adalah Next.js 15 aplikasi chat dengan authentication, conversation management, dan sidebar dengan auto-refresh functionality.

**Tech Stack:**
- Next.js 15.5.4 dengan React 19
- TypeScript
- Tailwind CSS v4 + Radix UI
- Zustand untuk state management
- Next.js App Router

---

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── chat/route.ts          # Chat API proxy ke backend
│   ├── layout.tsx                 # Root layout dengan metadata
│   ├── page.tsx                   # Home page
│   ├── assistant.tsx              # Main assistant component dengan header
│   └── globals.css                # Global styles
├── components/
│   ├── assistant-ui/
│   │   ├── chat-container.tsx     # Main chat UI container with message handling
│   │   ├── chat-input-area.tsx    # Memoized input component (prevents re-render on keystroke)
│   │   ├── message-bubble.tsx     # Message display (memoized for performance)
│   │   ├── thread-list.tsx        # Sidebar dengan conversation list & refresh button
│   │   ├── thread.tsx             # Chat messages display
│   │   ├── threadlist-sidebar.tsx # Sidebar wrapper dengan header "system-llm"
│   │   ├── document-sidebar.tsx   # Document viewer sidebar
│   │   ├── document-viewer.tsx    # PDF viewer with page navigation
│   │   ├── rag-search-indicator.tsx # Shows RAG search status (searching/found)
│   │   ├── rag-source-badges.tsx  # Clickable source badges (document + page)
│   │   ├── attachment.tsx         # File attachment handling
│   │   ├── markdown-text.tsx      # Markdown rendering
│   │   ├── tool-fallback.tsx      # Tool call results display
│   │   └── tooltip-icon-button.tsx # Reusable button component
│   ├── common/
│   │   ├── user-menu.tsx          # User profile menu
│   │   └── auth-guard.tsx         # Auth protection
│   ├── theme/
│   │   └── ThemeToggle.tsx        # Dark/light mode toggle
│   └── ui/                        # Radix UI components (button, input, dialog, etc)
├── lib/
│   ├── hooks/
│   │   ├── useCurrentThread.ts    # Track current thread/conversation (with sources persistence)
│   │   ├── useConversations.ts    # Manage conversation list (DEPRECATED - replaced by thread-list local state)
│   │   └── use-mobile.ts          # Responsive design detection
│   ├── services/
│   │   ├── conversation.ts        # API calls untuk conversation management
│   │   └── document.ts            # Document fetch/download service
│   ├── api/
│   │   └── chat.service.ts        # Chat streaming service
│   ├── types/
│   │   └── rag.ts                 # RAG types (RAGSource, RAGSearchEvent, RAGSearchState, etc)
│   └── utils.ts                   # Utility functions (cn for className)
├── hooks/                         # Custom React hooks
├── public/                        # Static assets
├── .env.local                     # Environment variables
├── package.json
├── next.config.ts
├── tsconfig.json
└── CLAUDE.md                      # This file

```

---

## Key Features

### 1. Authentication
- Email/password login via `/api/v1/auth/login`
- JWT token stored in localStorage
- User role-based access control (STUDENT, ADMIN)
- Protected routes dengan auth-guard

### 2. Conversation Management
- Create new conversation saat user kirim pesan pertama
- List all conversations di sidebar dengan refresh button
- Navigate antar conversations via URL param: `?thread={conversationId}`
- Delete conversation dengan confirmation

### 3. Chat Interface
- Real-time message streaming dari backend
- Support file attachments (images, documents)
- Markdown rendering untuk AI responses
- Tool call results display
- Auto-scroll ke latest message

### 4. RAG (Retrieval-Augmented Generation)
- LLM can search documents using semantic similarity
- Real-time search indicator during RAG operation
- Source badges show document name + page number
- Click source badge → viewer opens document at specific page
- Sources persist in DB - survive page refresh
- Loading stages: analyzing → searching → found → streaming

### 5. Sidebar
- Auto-refresh saat URL berubah (new thread created)
- Manual refresh button dengan loading state
- Conversation list sorted by newest first
- Header branded "system-llm" (bukan assistant-ui)
- Hapus GitHub link dan external references

### 6. Model Selection
- Dropdown model selector di header
- Default: GPT-4.1 Nano
- Support multiple LLM models dari backend config

---

## Recent Changes & Implementation

### ✅ RAG Integration (Retrieval-Augmented Generation)

1. **RAG Search Indicator** ([rag-search-indicator.tsx](frontend/components/assistant-ui/rag-search-indicator.tsx))
   - Shows "Searching documents" during RAG search phase
   - Shows "Found X sources in Ys" when search completes
   - Displays inside message bubble with proper styling
   - Dashed border when searching, solid green when found

2. **Source Badges Component** ([rag-source-badges.tsx](frontend/components/assistant-ui/rag-source-badges.tsx))
   - Display document sources as clickable badges
   - Shows: document name + page number
   - Deduplicates sources by document_id
   - Click to navigate viewer to specific document + page
   - Robust data normalization with fallbacks

3. **Loading Stages** ([chat-container.tsx](frontend/components/assistant-ui/chat-container.tsx))
   - `analyzing` - Initial LLM processing (bouncing dots animation)
   - `searching` - RAG search in progress (search icon)
   - `found` - RAG search complete (checkmark + count)
   - `streaming` - Text streaming (blinking cursor)
   - Stages display inside message bubble, not external

4. **Message Persistence with Sources**
   - Sources stored in DB with each message
   - Load sources on page refresh via `useCurrentThread`
   - Sources survive across browser sessions
   - RAG metadata (ragSearched flag) preserved

5. **Document Viewer Integration**
   - Source badges are clickable
   - Click badge → sidebar opens + loads document
   - Sidebar auto-navigates to selected page
   - URL fragment: `#page={pageNumber}` for PDF navigation
   - `DocumentViewer` component handles page jumping

6. **Streaming Improvements**
   - Backend splits responses into sentence chunks
   - Frontend uses `flushSync()` for per-chunk renders
   - Text streams smoothly (perlahan) instead of all-at-once
   - Proper event forwarding: `analyzing` → `searching` → `found` → `streaming`

7. **Chat Input Area Optimization**
   - Memoized `ChatInputArea` component
   - Prevents entire ChatContainer re-render on keystroke
   - Fixes input lag issues
   - Smooth typing experience

8. **Custom ThreadList Implementation** ([thread-list.tsx](frontend/components/assistant-ui/thread-list.tsx))
   - Independent dari `useConversations` hook yang bermasalah
   - Local state management: `conversations`, `isLoading`, `isRefreshing`, `error`
   - Direct fetch dari `listConversations()` service
   - **Guaranteed re-render** saat data berubah

9. **Auto-Refresh on URL Change**
   - Detect saat `currentThreadId` berubah (user navigasi ke thread baru)
   - Auto-trigger `loadConversationsLocal()`
   - Sidebar update otomatis tanpa perlu manual refresh

10. **Manual Refresh Button**
    - Refresh icon button di sidebar header
    - Click untuk fetch terbaru dari DB
    - Loading state dengan spinning icon
    - Console logs untuk debugging

11. **Auto-Refresh After Chat Creation**
    - [chat-container.tsx](frontend/components/assistant-ui/chat-container.tsx) line 120
    - Setelah conversation dibuat, call `loadConversations()` dari `useConversations` hook
    - Sidebar otomatis update dengan chat baru

12. **Branding Cleanup**
    - Header: "system-llm" (bukan "assistant-ui")
    - Tab browser: "system-llm - Chat Interface"
    - Hapus GitHub link di footer
    - Hapus external references

---

## API Endpoints

### Chat Endpoints
- `POST /api/v1/chat/sessions` - Create new conversation
- `GET /api/v1/chat/sessions` - List all conversations
- `GET /api/v1/chat/sessions/{id}` - Get conversation details + messages
- `PATCH /api/v1/chat/sessions/{id}` - Update conversation
- `DELETE /api/v1/chat/sessions/{id}` - Delete conversation
- `POST /api/chat` - Send message (frontend proxy route)

### Auth Endpoints
- `POST /api/v1/auth/login` - Login dengan email/password
- `POST /api/v1/auth/register` - Register user (if enabled)

### Config Endpoints
- `GET /api/v1/chat/config` - Get available models dan active prompt

---

## State Management

### Thread List State (LOCAL)
```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
```
- Fully independent dari global state
- Update guaranteed saat refresh
- Direct fetch dari service layer

### Current Thread State
Via `useCurrentThread()` hook:
- `threadId` - Current conversation ID dari URL
- `messages` - Loaded messages untuk thread
- `isLoading` - Loading indicator
- `loadMessages` - Manual reload function

### Authentication State
Via `authStore` (Zustand):
- `user` - User profile (email, role)
- `token` - JWT token
- `isLoading` - Auth check status
- `logout()` - Logout function

---

## Data Flow

### New Chat Flow
```
User type message at home (/)
  ↓
Click send (Enter key)
  ↓
chat-container: Create conversation via POST /api/v1/chat/sessions
  ↓
Get new conversationId back
  ↓
router.push(`/?thread={conversationId}`)
  ↓
URL berubah → currentThreadId change detect
  ↓
thread-list useEffect trigger
  ↓
loadConversationsLocal() fetch latest from DB
  ↓
setConversations() update state
  ↓
ThreadList re-render dengan chat baru ✨
```

### Send Message with RAG Flow
```
User type message + click send
  ↓
chat-container: Set loadingStage = "analyzing"
  ↓
POST /api/chat dengan messages array
  ↓
API route proxy ke backend: POST /api/v1/chat/sessions/{id}/messages
  ↓
Backend streams SSE events:
  ├─ event: user_message (log)
  ├─ event: rag_search (status: "searching")
  │   └─ loadingStage = "searching" (show search indicator)
  ├─ event: rag_search (status: "completed", results_count: N)
  │   └─ loadingStage = "found" (show found indicator with count)
  ├─ event: chunk (content: "...")
  │   ├─ loadingStage = "streaming" (on first chunk)
  │   └─ Update message.content incrementally with flushSync()
  └─ event: done (content: "...", sources: [...])
     ├─ Store sources in message.sources
     ├─ Set message.ragSearched = true
     └─ loadingStage = "idle"
  ↓
Frontend parse streaming chunks
  ↓
Update messages state real-time with flushSync()
  ↓
Display RAG indicators & source badges inside bubble
  ↓
Auto-scroll ke bottom ✨
```

### Source Badge Click Flow
```
User click source badge
  ↓
onSourceClick(docId, pageNumber)
  ↓
DocumentSidebar receives selectedSourceDoc prop
  ↓
setSelectedId(docId) + setSelectedPage(pageNumber)
  ↓
DocumentViewer menerima pageNumber
  ↓
Set iframe src to: `blob:{pdf_url}#page={pageNumber}`
  ↓
PDF opens at specific page ✨
```

### Message Persistence Flow
```
Page refresh atau switch thread
  ↓
useCurrentThread hook: GET /api/v1/chat/sessions/{id}
  ↓
Backend returns messages with sources field
  ↓
Map sources dengan normalization (document_name, page_number)
  ↓
Set in message.sources
  ↓
MessageBubble renders RAGSearchIndicator + sources badges
  ↓
Sources visible without losing data ✨
```

---

## Important Files

### Core Components
- **[assistant.tsx](frontend/app/assistant.tsx)** - Main layout dengan sidebar, header, chat area
- **[chat-container.tsx](frontend/components/assistant-ui/chat-container.tsx)** - Chat UI, message handling, streaming, RAG integration
- **[chat-input-area.tsx](frontend/components/assistant-ui/chat-input-area.tsx)** - Memoized input component (fixes keystroke lag)
- **[message-bubble.tsx](frontend/components/assistant-ui/message-bubble.tsx)** - Memoized message display with RAG indicators & sources
- **[thread-list.tsx](frontend/components/assistant-ui/thread-list.tsx)** - Sidebar conversation list dengan auto-refresh

### RAG Components
- **[rag-search-indicator.tsx](frontend/components/assistant-ui/rag-search-indicator.tsx)** - Shows search status & results
- **[rag-source-badges.tsx](frontend/components/assistant-ui/rag-source-badges.tsx)** - Clickable source badges with page navigation
- **[document-sidebar.tsx](frontend/components/assistant-ui/document-sidebar.tsx)** - Document viewer sidebar
- **[document-viewer.tsx](frontend/components/assistant-ui/document-viewer.tsx)** - PDF viewer with `#page=N` navigation

### Services
- **[conversation.ts](frontend/lib/services/conversation.ts)** - API wrapper untuk conversation endpoints
- **[chat.service.ts](frontend/lib/api/chat.service.ts)** - Chat streaming service
- **[document.ts](frontend/lib/services/document.ts)** - Document fetch/download

### Type Definitions
- **[rag.ts](frontend/lib/types/rag.ts)** - RAG types (RAGSource, RAGSearchState, StreamingEvent, etc)

### Hooks
- **[useCurrentThread.ts](frontend/lib/hooks/useCurrentThread.ts)** - Track current thread state with sources persistence
- **[useConversations.ts](frontend/lib/hooks/useConversations.ts)** - DEPRECATED, replaced by thread-list local state (tapi masih dipakai di chat-container)

---

## Environment Variables

```.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Production akan override via deployment.

---

## Common Issues & Solutions

### Issue: Sidebar tidak update saat new chat
**Solution:** Thread list sekarang punya auto-refresh on URL change
- Check console logs: `[ThreadList] URL changed to thread:`
- Verify `loadConversationsLocal()` di-call
- Check API response dari `/api/v1/chat/sessions`

### Issue: Database connection error di production
**Solution:** Perbaiki DATABASE_URL untuk Cloud SQL
- Use Cloud SQL Connector format atau public IP
- Jangan pakai `cloud-sql-proxy` hostname di Cloud Run

### Issue: Messages tidak load saat switch thread
**Solution:** Check `useCurrentThread.ts`
- Verify threadId di-extract dari URL correctly
- Check API call ke `/api/v1/chat/sessions/{id}`

---

## Recent Updates - Resizable Layout (2025-11-08)

### ✅ Dynamic 3-Panel Layout with Resizable Dividers
1. **Left Panel - Thread/Conversation List**
   - Sidebar dengan daftar chat (sidebar kiri)
   - Min width: 15%, Max: 40% (dapat di-resize)

2. **Center Panel - Chat Interface**
   - Main chat area dengan messages dan input (tengah)
   - Min width: 30%, Max: 70% (dapat di-resize)
   - DocumentSidebar dipindahkan ke right panel

3. **Right Panel - Document Viewer**
   - Document viewer untuk PDF/file (sidebar kanan)
   - Min width: 0% (collapsible), Max: 40%
   - Dapat di-collapse/expand untuk lebih space ke chat

### Implementation Details
- **Library**: `react-resizable-panels` v3.0.6
- **Hook**: `useResizablePanelSizes()` - persist panel sizes ke localStorage
- **Default Sizes**: Left 20%, Center 55%, Right 25%
- **Behavior**:
  - Drag resize handle untuk ubah ukuran panels
  - Panel sizes di-persist dan restore on page refresh
  - Smooth hover effect pada resize handles

### Updated Components
- [assistant.tsx](frontend/app/assistant.tsx) - Main layout dengan PanelGroup
- [chat-container.tsx](frontend/components/assistant-ui/chat-container.tsx) - Refactored tanpa DocumentSidebar internal
- [useResizablePanelSizes.ts](frontend/lib/hooks/useResizablePanelSizes.ts) - New hook untuk persist sizes

---

## Next Steps / TODOs

### Resizable Layout Enhancements
- [ ] Add keyboard shortcuts untuk resize (arrow keys)
- [ ] Add preset layout options (e.g., "Document Focus", "Chat Focus")
- [ ] Remember user's preferred layout per browser
- [ ] Mobile-friendly responsive behavior (stack panels on small screens)

### RAG Enhancements
- [ ] Implement RAG settings admin panel (top_k, similarity_threshold)
- [ ] Add document upload UI to sidebar
- [ ] Show document processing status
- [ ] Implement vector search UI with filters
- [ ] Add source ranking/relevance sorting

### Chat Features
- [ ] Implement conversation search/filtering di sidebar
- [ ] Add conversation renaming feature
- [ ] Implement message edit/delete
- [ ] Add voice input support
- [ ] Implement export chat history as PDF/Markdown
- [ ] Add conversation archiving
- [ ] Message reactions/rating for RAG quality

### Performance & UX
- [ ] Optimize bundle size
- [ ] Add PWA support
- [ ] Implement virtual scrolling for long conversations
- [ ] Add message caching layer
- [ ] Debounce source badge clicks to prevent race conditions

### Debugging
- [ ] Add visual RAG event timeline
- [ ] Show source relevance scores in debug mode
- [ ] Add message token count display
- [ ] Log streaming performance metrics

---

## Debugging

### Enable Detailed Logging
Semua components punya console.log dengan prefix `[ComponentName]`:
- `[ThreadList]` - Sidebar conversation list
- `[ChatContainer]` - Chat UI, message streaming, RAG events
- `[useCurrentThread]` - Current thread state, message loading
- `[useConversations]` - Conversation list hook
- `[DocumentSidebar]` - Document selection and page navigation
- `[RAGSourceBadges]` - Source badge rendering and filtering
- `[API Route]` - SSE event forwarding

Open DevTools → Console → Filter by component name untuk debugging.

### RAG Debugging Checklist
1. **Sources Not Displaying?**
   - Check console: `[ChatContainer] Done event data.sources:`
   - Verify sources array is not empty
   - Check `[RAGSourceBadges] Raw sources:` logs
   - Filter in RAGSourceBadges should have valid document_id/document_name

2. **Streaming Not Working?**
   - Check `[ChatContainer] CHUNK` logs
   - Verify `flushSync()` is being called
   - Look for `[API Route]` logs showing chunk events forwarded

3. **Source Badge Click Not Working?**
   - Check `[ChatContainer] Source clicked:` log
   - Verify `[DocumentSidebar] Selected source received:` appears
   - Check if sidebar opens and document loads
   - Browser console should not have errors about docId/pageNumber

4. **Page Refresh Losing Sources?**
   - Check `[useCurrentThread]` log showing sources from backend
   - Verify message.sources is populated after loading
   - Check message bubble renders RAGSearchIndicator + sources

---

## Deploy Notes

**Frontend:** Deploy ke Fly.io atau vercel
**Backend:** Deploy ke Cloud Run dengan proper DATABASE_URL setup

Current production URLs:
- Frontend: https://system-llm-chat.fly.dev
- Backend: Cloud Run (asia-southeast2)

---

## Summary of Latest Updates

**✅ Resizable Layout (NEW - 2025-11-08):**
- Dynamic 3-panel layout (left sidebar, center chat, right document viewer)
- Drag-to-resize dividers antara panels
- Panel sizes di-persist ke localStorage
- Default: 20% left, 55% center, 25% right
- Right panel collapsible untuk maximize chat space
- Smooth transitions dan hover effects pada resize handles

**✅ RAG Integration Complete:**
- RAG Search Indicator with real-time status
- Source Badges with document + page display
- Loading Stages (analyzing → searching → found → streaming)
- Message Persistence - sources survive page refresh
- Document Viewer Integration with page navigation
- Performance Optimizations (memoization, flushSync)
- Text Streaming by sentence chunks

**Key Architecture Decisions:**
- 3-panel layout dengan react-resizable-panels library
- All RAG content (indicators, sources) inside message bubble (not external)
- Sources stored in DB - retrieved on page load via `useCurrentThread`
- Panel sizes persist across sessions via useResizablePanelSizes hook
- ChatContainer fully extracted dari DocumentSidebar internal management
- `flushSync()` for smooth streaming animation
- Memoized components to prevent keystroke lag
- Event-driven loading stages for clear UX

**Debugging Helpers:**
- Console logs with `[ComponentName]` prefix for easy filtering
- Comprehensive logging in streaming parser
- Source normalization with fallbacks for robustness
- Panel resize events logged untuk debugging layout

Generated: 2025-11-08
Last Updated: Added dynamic resizable 3-panel layout with localStorage persistence

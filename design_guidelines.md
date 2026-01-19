# Design Guidelines: Test Series Platform

## Brand Identity

**Purpose**: An exam preparation platform that makes tackling PYQs (Previous Year Questions) systematic and trackable. Students use it to practice topic-wise, track their weak areas, and improve strategically.

**Aesthetic Direction**: **Editorial/Academic** - Clean, focused, minimal distractions. Think study-optimized: high contrast for readability, organized information hierarchy, calming confidence-building colors. Not playful, not flashy - serious about learning, but approachable.

**Memorable Element**: Progress rings on topic cards that fill as users practice - immediate visual feedback on mastery.

## Architecture Decisions

### Authentication
**Auth Required** - Platform has both guest and registered users with different capabilities.

**Implementation**:
- Guest Mode: Allow immediate access without signup (limited features: no progress saving across devices)
- SSO for registered users: Apple Sign-In (iOS), Google Sign-In (Android)
- Onboarding flow: "Continue as Guest" vs "Sign Up to Save Progress"
- Account screen includes logout and account deletion (nested under Settings)

### Navigation Architecture
**Tab Navigation** (4 tabs):
1. **Home** - Test series, recent activity, suggested topics
2. **PYQs** - Browse previous year questions by topic/year
3. **Analytics** - Topic-wise performance breakdown
4. **Profile** - User settings, progress, account management

Floating Action Button: "Start Practice" - positioned above tab bar, launches quick practice session

## Screen-by-Screen Specifications

### 1. Onboarding (Stack-Only)
**Purpose**: Welcome new users, explain value proposition
- Single screen with illustration
- Two buttons: "Continue as Guest" (outlined), "Sign Up" (filled primary)
- No header
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

### 2. Home Tab
**Purpose**: Dashboard showing available test series, progress snapshot, recommended practice
**Header**: Transparent, greeting text ("Good morning, [Name]"), right button = notifications bell icon
**Content**: ScrollView with sections:
- Hero card: Current streak / total questions solved
- "Continue Practicing" horizontal scroll (topic cards with progress rings)
- "Test Series" list (upcoming/available tests)
**Safe Area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
**Empty State**: "Start your first practice session" (show asset: empty-home.png)

### 3. PYQs Tab
**Purpose**: Browse and filter previous year questions by topic, year, difficulty
**Header**: Non-transparent, title "PYQs", search bar, filter icon (right)
**Content**: FlatList of topic cards with year badges
**Safe Area**: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
**Empty State**: "No questions match your filters" (asset: empty-search.png)

### 4. Analytics Tab
**Purpose**: Visualize topic-wise performance, identify weak areas
**Header**: Transparent, title "Your Analytics", right button = date range selector
**Content**: ScrollView with:
- Overall accuracy card (large circular progress)
- Topic breakdown list (topic name, accuracy %, questions attempted)
- Weak topics section (cards with "Practice Now" CTA)
**Safe Area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
**Empty State**: "Complete practice sessions to see analytics" (asset: empty-analytics.png)

### 5. Profile Tab
**Purpose**: Account management, settings, app preferences
**Header**: Transparent, right button = settings gear icon
**Content**: ScrollView with:
- Avatar + display name (editable for registered users, "Guest User" for guests)
- Stats row: Total questions, streak, accuracy
- Settings list: Theme, Notifications, Privacy Policy, Terms
- If guest: "Sign up to save progress" banner
- Account actions (logout, delete - nested in settings)
**Safe Area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### 6. Practice Session (Modal)
**Purpose**: Full-screen question-taking interface
**Header**: Custom with timer, question counter (1/50), exit icon (left)
**Content**: 
- Question text area
- Multiple choice options (full-width cards)
- "Submit Answer" button (bottom)
**Safe Area**: top = headerHeight + Spacing.xl, bottom = insets.bottom + Spacing.xl
**Layout**: Not scrollable, fixed layout

### 7. Result Screen (Stack)
**Purpose**: Show quiz results, breakdown by topic
**Header**: Non-transparent, title "Results", close button (right)
**Content**: ScrollView with:
- Score card (circular progress showing %)
- Topic-wise breakdown (collapsible sections)
- "Review Incorrect" button
- "Practice Again" button
**Safe Area**: top = Spacing.xl, bottom = insets.bottom + Spacing.xl

## Color Palette

**Primary**: #2E7D32 (Forest Green) - confidence, growth, academic
**Primary Variant**: #1B5E20 (Darker Green) - pressed states
**Background**: #FAFAFA (Soft White) - reduces eye strain
**Surface**: #FFFFFF (Pure White) - cards, modals
**Text Primary**: #212121 (Near Black)
**Text Secondary**: #757575 (Medium Gray)
**Accent**: #FF6F00 (Amber) - weak topics, important alerts
**Success**: #4CAF50 (Correct answers)
**Error**: #F44336 (Incorrect answers)
**Border**: #E0E0E0 (Light Gray)

## Typography

**Font**: System font (SF Pro for iOS, Roboto for Android)
**Type Scale**:
- Display: 28pt Bold (hero numbers, scores)
- Title: 20pt Bold (screen titles, card headers)
- Headline: 18pt Semibold (section headers)
- Body: 16pt Regular (question text, descriptions)
- Caption: 14pt Regular (metadata, timestamps)
- Small: 12pt Regular (labels, hints)

## Visual Design

- Progress rings: 8pt stroke, animated fill
- Topic cards: 12pt border radius, subtle elevation (no shadow)
- Answer options: Full-width cards with 8pt radius, 1pt border, press = fill background
- Floating Action Button: 56x56pt circle, Primary color, shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- Use Feather icons for navigation and actions
- Tab bar icons should be outlined when inactive, filled when active

## Generated Assets

1. **icon.png** - App icon showing a graduation cap with checkmark, green and amber color scheme
2. **splash-icon.png** - Same as app icon, centered on solid background
3. **empty-home.png** - Illustration of an open book with floating question marks, muted green tones. WHERE USED: Home tab when user has no recent activity
4. **empty-search.png** - Illustration of a magnifying glass over blank paper. WHERE USED: PYQs tab when filters return no results
5. **empty-analytics.png** - Illustration of an empty bar chart/graph. WHERE USED: Analytics tab when user has no completed sessions
6. **avatar-default.png** - Simple circular avatar with graduation cap icon. WHERE USED: Profile screen for users who haven't uploaded photo
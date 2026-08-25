# Chess Unboxed - Comprehensive Database Schema

This schema supports a full-featured multiplayer chess platform with social features, tournaments, achievements, and more.

## Core Features Supported:
- **User Management**: Registration, guests, profiles, preferences
- **Social Features**: Friends, blocking, direct messaging, notifications
- **Game System**: 3 game modes, spectating, analysis, history
- **Lobby System**: Mode-specific lobbies with custom settings
- **Tournament System**: Swiss, elimination, round-robin tournaments
- **Rating System**: ELO ratings per mode with history
- **Achievement System**: Unlockable achievements and badges
- **Moderation**: Reports, bans, chat moderation
- **Analytics**: Detailed statistics and activity tracking

---

## SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Users table (supports both registered users and guests)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Authentication & Identity
    email VARCHAR(255) UNIQUE, -- NULL for guest users
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    password_hash VARCHAR(255), -- NULL for guest users (OAuth/guest)
    
    -- Profile Information
    bio TEXT,
    avatar_url TEXT,
    country VARCHAR(3), -- ISO country code
    timezone VARCHAR(50),
    birth_date DATE,
    language VARCHAR(10) DEFAULT 'en',
    
    -- Account Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_guest BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMPTZ,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Gaming Profile
    fide_rating INTEGER,
    preferred_time_control JSONB, -- {initial: 600, increment: 5}
    playstyle_tags TEXT[], -- ['aggressive', 'positional', 'tactical']
    
    -- Privacy Settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    allow_friend_requests BOOLEAN DEFAULT TRUE,
    show_online_status BOOLEAN DEFAULT TRUE,
    allow_game_spectators BOOLEAN DEFAULT TRUE,
    allow_message_invites BOOLEAN DEFAULT TRUE,
    
    -- Moderation
    is_banned BOOLEAN DEFAULT FALSE,
    ban_expires_at TIMESTAMPTZ,
    ban_reason TEXT,
    is_muted BOOLEAN DEFAULT FALSE,
    mute_expires_at TIMESTAMPTZ,
    
    -- Metadata
    registration_ip INET,
    email_verified_at TIMESTAMPTZ,
    terms_accepted_at TIMESTAMPTZ
);

-- User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB, -- {browser, os, device_type}
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Game Preferences
    board_theme VARCHAR(50) DEFAULT 'classic',
    piece_set VARCHAR(50) DEFAULT 'standard',
    sound_enabled BOOLEAN DEFAULT TRUE,
    move_hints BOOLEAN DEFAULT TRUE,
    show_coordinates BOOLEAN DEFAULT TRUE,
    highlight_moves BOOLEAN DEFAULT TRUE,
    
    -- UI Preferences
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    -- Game Settings
    auto_queen BOOLEAN DEFAULT FALSE,
    confirm_moves BOOLEAN DEFAULT FALSE,
    show_captured_pieces BOOLEAN DEFAULT TRUE,
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    friend_request_notifications BOOLEAN DEFAULT TRUE,
    game_invitation_notifications BOOLEAN DEFAULT TRUE,
    tournament_notifications BOOLEAN DEFAULT TRUE,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =============================================
-- RATINGS & STATISTICS
-- =============================================

-- User ratings per game mode
CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('classic', 'unboxed', 'programming')),
    
    -- Rating Information
    current_rating INTEGER NOT NULL DEFAULT 1200,
    peak_rating INTEGER NOT NULL DEFAULT 1200,
    lowest_rating INTEGER NOT NULL DEFAULT 1200,
    
    -- Game Statistics
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    
    -- Performance Metrics
    win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,
    rating_deviation DECIMAL(5,2) DEFAULT 350.0, -- For Glicko-2 system
    volatility DECIMAL(8,6) DEFAULT 0.06,
    
    -- Time Statistics
    total_time_played INTERVAL DEFAULT '0 seconds',
    average_game_time INTERVAL DEFAULT '0 seconds',
    
    -- Metadata
    last_game_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, game_mode)
);

-- Rating history for tracking rating changes over time
CREATE TABLE rating_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('classic', 'unboxed', 'programming')),
    game_id UUID, -- References games.id (added later)
    
    rating_before INTEGER NOT NULL,
    rating_after INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SOCIAL FEATURES
-- =============================================

-- Friendships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- User blocks
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- =============================================
-- GAME SYSTEM
-- =============================================

-- Games
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Game Type & Mode
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('classic', 'unboxed', 'programming')),
    game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('bot', 'pvp', 'endless', 'tournament')),
    
    -- Players
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Game Settings
    time_control JSONB, -- {initial: 600, increment: 5, type: 'standard'}
    rated BOOLEAN DEFAULT TRUE,
    
    -- Game State
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned', 'draw')),
    result VARCHAR(20) CHECK (result IN ('white_wins', 'black_wins', 'draw', 'abandoned')),
    result_reason VARCHAR(50), -- 'checkmate', 'timeout', 'resignation', 'agreement', etc.
    
    -- Game Data
    moves JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of moves in algebraic notation
    initial_fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    final_fen TEXT,
    
    -- Programming Chess specific
    white_code TEXT, -- JavaScript code for white player
    black_code TEXT, -- JavaScript code for black player
    
    -- Metadata
    spectator_count INTEGER DEFAULT 0,
    tournament_id UUID, -- References tournaments.id (added later)
    lobby_id UUID, -- References lobbies.id (added later)
    
    -- Analysis
    accuracy_white DECIMAL(5,2),
    accuracy_black DECIMAL(5,2),
    blunders_white INTEGER DEFAULT 0,
    blunders_black INTEGER DEFAULT 0,
    brilliant_moves_white INTEGER DEFAULT 0,
    brilliant_moves_black INTEGER DEFAULT 0
);

-- Game moves (for detailed move tracking and analysis)
CREATE TABLE game_moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    player_color VARCHAR(5) NOT NULL CHECK (player_color IN ('white', 'black')),
    
    -- Move Data
    move_san VARCHAR(10) NOT NULL, -- Standard Algebraic Notation
    move_uci VARCHAR(10) NOT NULL, -- Universal Chess Interface
    fen_before TEXT NOT NULL,
    fen_after TEXT NOT NULL,
    
    -- Timing
    time_spent INTERVAL, -- Time spent on this move
    time_remaining INTERVAL, -- Time remaining after move
    
    -- Analysis (populated by chess engine)
    evaluation DECIMAL(6,2), -- Engine evaluation in centipawns
    best_move VARCHAR(10), -- Engine's suggested best move
    move_quality VARCHAR(20), -- 'brilliant', 'great', 'good', 'inaccuracy', 'mistake', 'blunder'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game spectators
CREATE TABLE game_spectators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_watching BOOLEAN DEFAULT TRUE,
    
    UNIQUE(game_id, user_id)
);

-- =============================================
-- LOBBY SYSTEM
-- =============================================

-- Lobbies
CREATE TABLE lobbies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Lobby Settings
    name VARCHAR(100),
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('classic', 'unboxed', 'programming')),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Game Configuration
    time_control JSONB NOT NULL, -- {initial: 600, increment: 5}
    rated BOOLEAN DEFAULT TRUE,
    min_rating INTEGER,
    max_rating INTEGER,
    
    -- Lobby State
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'full', 'in_game', 'completed')),
    max_players INTEGER DEFAULT 2,
    current_players INTEGER DEFAULT 1,
    
    -- Privacy
    is_private BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255), -- For private lobbies
    
    -- Auto-settings
    auto_start BOOLEAN DEFAULT FALSE,
    auto_start_delay INTERVAL DEFAULT '10 seconds',
    
    -- Metadata
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Lobby participants
CREATE TABLE lobby_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('host', 'player', 'spectator')),
    preferred_color VARCHAR(10) CHECK (preferred_color IN ('white', 'black', 'random')),
    is_ready BOOLEAN DEFAULT FALSE,
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(lobby_id, user_id)
);

-- =============================================
-- TOURNAMENTS
-- =============================================

-- Tournaments
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Tournament Info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tournament Settings
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('classic', 'unboxed', 'programming')),
    tournament_type VARCHAR(20) NOT NULL CHECK (tournament_type IN ('swiss', 'elimination', 'round_robin')),
    time_control JSONB NOT NULL,
    
    -- Scheduling
    registration_opens_at TIMESTAMPTZ NOT NULL,
    registration_closes_at TIMESTAMPTZ NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    
    -- Participation
    max_participants INTEGER,
    min_rating INTEGER,
    max_rating INTEGER,
    entry_fee INTEGER DEFAULT 0, -- In credits/points
    
    -- Tournament State
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration', 'in_progress', 'completed', 'cancelled')),
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER,
    
    -- Prizes
    prize_pool INTEGER DEFAULT 0,
    prize_distribution JSONB, -- {1: 500, 2: 300, 3: 200}
    
    -- Settings
    is_rated BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    auto_pairing BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    total_participants INTEGER DEFAULT 0,
    completed_games INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0
);

-- Tournament participants
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Participation Info
    seed_number INTEGER,
    initial_rating INTEGER NOT NULL,
    
    -- Tournament Performance
    score DECIMAL(4,1) DEFAULT 0.0, -- Swiss points (0.5 for draw, 1 for win)
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    
    -- Ranking
    current_rank INTEGER,
    final_rank INTEGER,
    
    -- Metadata
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrew_at TIMESTAMPTZ,
    prize_amount INTEGER DEFAULT 0,
    
    UNIQUE(tournament_id, user_id)
);

-- Tournament rounds
CREATE TABLE tournament_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    
    -- Timing
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    
    -- Metadata
    total_games INTEGER DEFAULT 0,
    completed_games INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tournament_id, round_number)
);

-- Tournament pairings
CREATE TABLE tournament_pairings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES tournament_rounds(id) ON DELETE CASCADE,
    
    -- Players
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Game Info
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    board_number INTEGER, -- For display purposes
    
    -- Result
    result VARCHAR(20), -- 'white_wins', 'black_wins', 'draw', 'forfeit_white', 'forfeit_black'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- MESSAGING & NOTIFICATIONS
-- =============================================

-- Direct messages between users
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'game_invite', 'friend_request')),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    edited_at TIMESTAMPTZ,
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Related content (for game invites, etc.)
    related_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    related_data JSONB, -- Additional context for special message types
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure users can't message themselves
    CHECK (sender_id != recipient_id)
);

-- Message conversations (automatically created when users first message each other)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    is_archived_by_user1 BOOLEAN DEFAULT FALSE,
    is_archived_by_user2 BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE, -- If either user blocks the other
    
    -- Metadata
    last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CHECK (user1_id != user2_id),
    CHECK (user1_id < user2_id) -- Ensure user1_id is always smaller to maintain uniqueness
);

-- Create unique index to ensure only one conversation per user pair
CREATE UNIQUE INDEX idx_conversations_unique_pair ON conversations(user1_id, user2_id);

-- Note: When creating conversations in application logic, always ensure:
-- user1_id = LEAST(userA_id, userB_id) and user2_id = GREATEST(userA_id, userB_id)
-- This maintains the constraint that user1_id < user2_id

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Content
    type VARCHAR(50) NOT NULL, -- 'friend_request', 'game_invitation', 'tournament_start', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    -- References (optional, depends on notification type)
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Action data (for interactive notifications)
    action_data JSONB, -- {game_id: 'xxx', action: 'accept_invitation'}
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- =============================================
-- ACHIEVEMENTS & GAMIFICATION
-- =============================================

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Achievement Info
    key VARCHAR(50) NOT NULL UNIQUE, -- 'first_win', 'rating_1500', 'win_streak_10'
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'gameplay', 'social', 'progression', 'special'
    
    -- Requirements
    requirements JSONB, -- {wins: 10, game_mode: 'classic'}
    points INTEGER NOT NULL DEFAULT 0,
    
    -- Display
    icon_url TEXT,
    badge_color VARCHAR(20),
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_secret BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progress
    progress JSONB DEFAULT '{}'::jsonb, -- {current: 5, target: 10}
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    notified BOOLEAN DEFAULT FALSE,
    points_awarded INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- =============================================
-- MODERATION & REPORTS
-- =============================================

-- User reports
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Report Details
    reason VARCHAR(50) NOT NULL, -- 'cheating', 'harassment', 'inappropriate_username', etc.
    category VARCHAR(30) NOT NULL, -- 'behavior', 'cheating', 'content'
    description TEXT,
    evidence_urls TEXT[], -- Screenshots, game links, etc.
    
    -- Related Content
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Resolution
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    resolution TEXT,
    action_taken VARCHAR(50), -- 'warning', 'mute', 'ban', 'no_action'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation actions
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Action Details
    action_type VARCHAR(30) NOT NULL, -- 'warn', 'mute', 'ban', 'username_change'
    reason VARCHAR(100) NOT NULL,
    duration INTERVAL, -- NULL for permanent actions
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    report_id UUID REFERENCES user_reports(id) ON DELETE SET NULL,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ENDLESS MODE SESSIONS
-- =============================================

-- Endless mode sessions (existing but enhanced)
CREATE TABLE endless_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('classic', 'unboxed', 'programming')),
    
    -- Session Info
    score INTEGER DEFAULT 0,
    high_score BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    
    -- Difficulty progression
    current_level INTEGER DEFAULT 1,
    bot_difficulty INTEGER DEFAULT 1000, -- Starting bot rating
    
    -- Session Data
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_time_played INTERVAL DEFAULT '0 seconds',
    
    -- Session settings
    time_control JSONB,
    
    UNIQUE(user_id, game_mode, active) -- Only one active session per mode per user
);

-- =============================================
-- ANALYTICS & ACTIVITY TRACKING
-- =============================================

-- User activity log
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity Info
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'game_start', 'friend_add', etc.
    description TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Related entities
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB, -- Additional context data
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily active users tracking
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- User metrics
    daily_active_users INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    guest_users INTEGER DEFAULT 0,
    
    -- Game metrics
    games_started INTEGER DEFAULT 0,
    games_completed INTEGER DEFAULT 0,
    total_game_time INTERVAL DEFAULT '0 seconds',
    
    -- Feature usage
    tournaments_created INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_is_guest ON users(is_guest);

-- Game indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_game_mode ON games(game_mode);
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_games_tournament ON games(tournament_id);

-- Rating indexes
CREATE INDEX idx_user_ratings_mode ON user_ratings(user_id, game_mode);
CREATE INDEX idx_user_ratings_rating ON user_ratings(game_mode, current_rating DESC);

-- Social indexes
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);

-- Lobby indexes
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_game_mode ON lobbies(game_mode);
CREATE INDEX idx_lobbies_created_at ON lobbies(created_at);

-- Tournament indexes
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_game_mode ON tournaments(game_mode);
CREATE INDEX idx_tournaments_starts_at ON tournaments(starts_at);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Messaging indexes
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at);
CREATE INDEX idx_conversations_users ON conversations(user1_id, user2_id);

-- Activity indexes
CREATE INDEX idx_user_activity_user ON user_activity(user_id, created_at);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type, created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update updated_at columns automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ratings_updated_at BEFORE UPDATE ON user_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your needs)
-- Users can read their own data and public profiles of others
CREATE POLICY users_select_policy ON users
    FOR SELECT USING (
        id = auth.uid() OR 
        profile_visibility = 'public' OR 
        (profile_visibility = 'friends' AND id IN (
            SELECT CASE 
                WHEN requester_id = auth.uid() THEN addressee_id
                ELSE requester_id
            END FROM friendships 
            WHERE status = 'accepted' AND (requester_id = auth.uid() OR addressee_id = auth.uid())
        ))
    );

-- Users can only update their own data
CREATE POLICY users_update_policy ON users
    FOR UPDATE USING (id = auth.uid());

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default achievements
INSERT INTO achievements (key, name, description, category, points, rarity) VALUES
('first_game', 'First Move', 'Play your first game', 'gameplay', 10, 'common'),
('first_win', 'Victory!', 'Win your first game', 'gameplay', 25, 'common'),
('rating_1400', 'Getting Better', 'Reach 1400 rating', 'progression', 50, 'uncommon'),
('rating_1600', 'Intermediate Player', 'Reach 1600 rating', 'progression', 100, 'uncommon'),
('rating_1800', 'Advanced Player', 'Reach 1800 rating', 'progression', 200, 'rare'),
('rating_2000', 'Expert Player', 'Reach 2000 rating', 'progression', 500, 'epic'),
('win_streak_5', 'On Fire!', 'Win 5 games in a row', 'gameplay', 75, 'uncommon'),
('win_streak_10', 'Unstoppable!', 'Win 10 games in a row', 'gameplay', 200, 'rare'),
('first_friend', 'Social Player', 'Add your first friend', 'social', 25, 'common'),
('tournament_winner', 'Champion', 'Win a tournament', 'gameplay', 1000, 'epic'),
('perfectionist', 'Flawless Victory', 'Win a game with 100% accuracy', 'gameplay', 500, 'legendary'),
('speedster', 'Lightning Fast', 'Win a game in under 10 moves', 'gameplay', 300, 'rare'),
('endurance', 'Marathon Player', 'Play for 6 hours in one day', 'gameplay', 100, 'uncommon'),
('social_butterfly', '100 Friends', 'Have 100 friends', 'social', 250, 'rare'),
('chat_master', 'Conversationalist', 'Send 1000 messages to friends', 'social', 50, 'uncommon');

-- No default messaging data needed - conversations are created automatically when users first message each other

-- Set up default user preferences for existing users (if any)
-- This would be handled by application logic during user registration
```

## Usage Instructions

1. **Run this SQL in your Supabase SQL Editor**
2. **Update your TypeScript types** in `src/lib/supabase.ts` to match this new schema
3. **Enable RLS policies** as needed for your security requirements
4. **Configure Supabase Storage** for avatar uploads and file attachments

## Key Features of This Schema:

✅ **Complete User System** - Registration, guests, profiles, preferences
✅ **Advanced Rating System** - Per-mode ratings with history tracking  
✅ **Social Features** - Friends, blocking, direct messaging, notifications
✅ **Tournament System** - Swiss, elimination, round-robin tournaments
✅ **Achievement System** - Gamification with unlockable badges
✅ **Moderation Tools** - Reports, bans, chat moderation
✅ **Analytics Tracking** - User activity and system metrics
✅ **Performance Optimized** - Proper indexes and triggers
✅ **Security Ready** - RLS policies for data protection

This schema is designed to scale from a small chess site to a full competitive gaming platform!
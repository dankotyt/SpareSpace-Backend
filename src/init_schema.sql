CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TYPE user_role_type AS ENUM ('RENTER', 'LANDLORD', 'ADMIN');
CREATE TYPE listing_type AS ENUM ('GARAGE', 'STORAGE', 'PARKING');
CREATE TYPE listing_period_type AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');
CREATE TYPE listing_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'INACTIVE');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_method AS ENUM ('CARD', 'SBP', 'USDT', 'ETH', 'TRX');
CREATE TYPE payment_status AS ENUM ('PENDING', 'BLOCKED', 'COMPLETED', 'REFUNDED');
CREATE TYPE transaction_type AS ENUM ('TOPUP', 'CHARGE', 'PAYOUT', 'COMMISSION');
CREATE TYPE currency_type AS ENUM ('RUB', 'USD', 'USDT', 'ETH', 'TRX');
CREATE TYPE notification_type AS ENUM ('NEW_BOOKING', 'CONFIRMATION', 'REMINDER', 'MESSAGE');
CREATE TYPE notification_channel AS ENUM ('TG_BOT', 'PUSH', 'EMAIL');
CREATE TYPE notification_status AS ENUM('UNREAD', 'READ');
CREATE TYPE subscription_status AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE moderation_entity_type AS ENUM ('LISTING', 'REVIEW', 'USER');
CREATE TYPE moderation_action AS ENUM ('APPROVE', 'REJECT', 'EDIT', 'BAN');



CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL, 
    patronymic VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    rating DECIMAL(3,2),
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);



CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);



CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type listing_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(26,16) NOT NULL,  -- цена за единицу времени(за день/неделю/месяц)
    price_period listing_period_type NOT NULL DEFAULT 'DAY',
    currency currency_type NOT NULL DEFAULT 'RUB',
    location GEOMETRY(POINT, 4326),  -- для Google/Яндекс карт
    address VARCHAR(500) NOT NULL,
    size DECIMAL(10,2),
    photos_json JSONB,  -- массив URL в S3
    amenities JSONB,  -- например, { "security": true, "electricity": true }
    availability tsrange[] DEFAULT '{}',  -- массив периодов доступности
    status listing_status NOT NULL DEFAULT 'DRAFT',
    views_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,  -- количество пользователей, добавивших в избранное
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_location ON listings USING GIST(location);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_availability ON listings USING GIN(availability);



CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    renter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    period tsrange NOT NULL,  -- период брони (start_date, end_date)
    price_total DECIMAL(26,16) NOT NULL,  -- [цена за единицу времени] * [кол-во дней/недель/месяцев]
    currency currency_type NOT NULL DEFAULT 'RUB',
    status booking_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_period ON bookings USING GIST(period);



CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);



CREATE TABLE wallet_balances (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    balance DECIMAL(26,16) NOT NULL DEFAULT 0,
    currency currency_type NOT NULL,
    UNIQUE (wallet_id, currency)
);

CREATE INDEX idx_wallet_balances_wallet_id ON wallet_balances(wallet_id);
CREATE INDEX idx_wallet_balances_currency ON wallet_balances(currency);



CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(26,16) NOT NULL,
    currency currency_type NOT NULL DEFAULT 'RUB',
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    gateway_transaction_id VARCHAR(255),  -- для РФ-шлюзов/крипты
    refund_reason TEXT,  -- при возврате
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);



CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(26,16) NOT NULL,
    currency currency_type NOT NULL,
    status payment_status NOT NULL DEFAULT 'COMPLETED',
    booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
    commission DECIMAL(26,16) DEFAULT 0,
    description TEXT,
    gateway_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);



CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,  -- Название тарифа, например, "Basic", "Pro"
    price DECIMAL(26,16) NOT NULL DEFAULT 0,
    currency currency_type NOT NULL DEFAULT 'RUB',
    max_listings INTEGER NOT NULL DEFAULT 0,
    priority_search BOOLEAN NOT NULL DEFAULT FALSE,
    boosts_per_month INTEGER NOT NULL DEFAULT 0,  -- Количество доступных поднятий в месяц
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    extra_features JSONB DEFAULT '{}'::JSONB  -- Для редко используемых или будущих фич
);

CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);



CREATE TABLE user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,  -- NULL для бессрочных подписок
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);



-- чат между двумя пользователями по конкретному объявлению
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    participant1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT REFERENCES listings(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2_id ON conversations(participant2_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);



CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);



CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    content TEXT NOT NULL,
    channel notification_channel NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    status notification_status NOT NULL DEFAULT 'UNREAD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);



CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    from_user_id BIGINT NOT NULL REFERENCES users(id),
    to_user_id BIGINT NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_to_user_id ON reviews(to_user_id);



-- хранит публичные вопросы и ответы по объявлениям
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_questions_listing_id ON questions(listing_id);
CREATE INDEX idx_questions_from_user_id ON questions(from_user_id);
CREATE INDEX idx_questions_to_user_id ON questions(to_user_id);



CREATE TABLE view_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_listing_id ON view_history(listing_id);



CREATE TABLE reposts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_listing_id ON reposts(listing_id);



CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);



CREATE TABLE user_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_refresh_token ON user_tokens(refresh_token_hash);



CREATE TABLE moderation_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type moderation_entity_type NOT NULL,
    entity_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,  -- администратор, выполнивший действие
    action moderation_action NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moderation_logs_entity_type ON moderation_logs(entity_type);
CREATE INDEX idx_moderation_logs_admin_id ON moderation_logs(admin_id);



CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- Пользователь, совершивший действие
    action VARCHAR(100) NOT NULL,  -- Тип действия, например, 'CREATE_LISTING', 'UPDATE_PROFILE'
    entity_id BIGINT,  -- ID сущности, если применимо
    details JSONB,  -- Дополнительные данные (например, старые/новые значения)
    ip_address INET,  -- Опционально
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);



-- Связи между таблицами: 
-- users → user_roles: N:N
-- users → listings: 1:N
-- listings → bookings: 1:N
-- users → bookings: 1:N
-- bookings → payments: 1:1
-- listings → reviews: 1:N
-- users → reviews (from_user_id, to_user_id): 1:N
-- users → wallets: 1:1
-- wallets → wallet_balances: 1:N
-- wallets → transactions: 1:N
-- bookings → transactions: 1:1 
-- users → user_tokens: 1:N
-- users → favorites: 1:N
-- listings → favorites: 1:N
-- users → reposts: 1:N
-- listings → reposts: 1:N
-- listings → questions: 1:N
-- users → questions (from_user_id, to_user_id): 1:N
-- users → view_history: 1:N
-- listings → view_history: 1:N
-- users → user_subscriptions: 1:N
-- subscription_plans → user_subscriptions: 1:N
-- users → conversations (participant1_id, participant2_id): 1:N
-- listings → conversations: 1:N
-- conversations → messages: 1:N
-- users → messages (sender_id): 1:N
-- users → notifications: 1:N
-- users → moderation_logs (admin_id): 1:N
-- users → audit_logs: 1:N

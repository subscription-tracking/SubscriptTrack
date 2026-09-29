import '../../../domain/subscription_models.dart';

/// Formda öneri olarak gösterilen popüler servisler.
const popularSubscriptionPresets = <(String, SubscriptionCategory)>[
  // Streaming
  ('Netflix', SubscriptionCategory.streaming),
  ('Disney+', SubscriptionCategory.streaming),
  ('YouTube Premium', SubscriptionCategory.streaming),
  ('BluTV', SubscriptionCategory.streaming),
  ('Exxen', SubscriptionCategory.streaming),
  ('Amazon Prime', SubscriptionCategory.streaming),
  ('Apple TV+', SubscriptionCategory.streaming),
  ('MUBI', SubscriptionCategory.streaming),
  // Music
  ('Spotify', SubscriptionCategory.music),
  ('Apple Music', SubscriptionCategory.music),
  ('YouTube Music', SubscriptionCategory.music),
  ('Tidal', SubscriptionCategory.music),
  ('Deezer', SubscriptionCategory.music),
  // AI & Productivity
  ('ChatGPT', SubscriptionCategory.software),
  ('Claude', SubscriptionCategory.software),
  ('Notion', SubscriptionCategory.software),
  ('Slack', SubscriptionCategory.software),
  // Creative
  ('Figma', SubscriptionCategory.software),
  ('Adobe', SubscriptionCategory.software),
  ('Canva', SubscriptionCategory.software),
  // Cloud
  ('iCloud', SubscriptionCategory.cloud),
  ('Google One', SubscriptionCategory.cloud),
  ('Dropbox', SubscriptionCategory.cloud),
  // Gaming
  ('Xbox Game Pass', SubscriptionCategory.gaming),
  ('PlayStation Plus', SubscriptionCategory.gaming),
  ('EA Play', SubscriptionCategory.gaming),
];

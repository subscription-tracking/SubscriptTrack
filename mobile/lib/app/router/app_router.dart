import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/navigation/app_routes.dart';
import '../../core/services/app_lock_service.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/notifications/presentation/notification_controller.dart';
import '../../features/notifications/presentation/screens/notification_center_screen.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/savings/presentation/screens/savings_screen.dart';
import '../../features/settings/presentation/screens/app_lock_settings_screen.dart';
import '../../features/settings/presentation/screens/appearance_screen.dart';
import '../../features/settings/presentation/screens/delete_account_screen.dart';
import '../../features/settings/presentation/screens/export_data_screen.dart';
import '../../features/settings/presentation/screens/feedback_screen.dart';
import '../../features/settings/presentation/screens/notification_preferences_screen.dart';
import '../../features/settings/presentation/screens/payment_methods_screen.dart';
import '../../features/settings/presentation/screens/privacy_center_screen.dart';
import '../../features/settings/presentation/screens/privacy_policy_screen.dart';
import '../../features/settings/presentation/screens/profile_screen.dart';
import '../../features/settings/presentation/screens/terms_of_service_screen.dart';
import '../../features/settings/presentation/settings_controller.dart';
import '../../features/stats/presentation/screens/payment_history_screen.dart';
import '../../features/stats/presentation/screens/stats_screen.dart';
import '../../features/subscriptions/presentation/screens/add_subscription_screen.dart';
import '../../features/subscriptions/presentation/screens/archived_subscriptions_screen.dart';
import '../../features/subscriptions/presentation/screens/csv_import_screen.dart';
import '../../features/subscriptions/presentation/screens/edit_subscription_screen.dart';
import '../../features/subscriptions/presentation/screens/subscription_detail_screen.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import '../shell/app_shell.dart';
import '../shell/authenticated_shell.dart';
import '../splash_screen.dart';
import 'route_helpers.dart';

class AppRouter {
  static GoRouter create(AuthController auth) => GoRouter(
        refreshListenable: auth,
        initialLocation: AppRoutes.splash,
        redirect: (context, state) => _redirect(auth, state.matchedLocation),
        routes: [
          GoRoute(
            path: AppRoutes.splash,
            builder: (_, __) => const SplashScreen(),
          ),
          GoRoute(
            path: AppRoutes.onboarding,
            builder: (context, _) => OnboardingScreen(
              onDone: () async {
                await OnboardingScreen.markDone();
                if (context.mounted) {
                  context.read<AuthController>().onboardingDone();
                }
              },
            ),
          ),
          GoRoute(
            path: AppRoutes.login,
            builder: (context, _) => LoginScreen(
              controller: context.read<AuthController>(),
              onRegisterTap: () => context.go(AppRoutes.register),
            ),
          ),
          GoRoute(
            path: AppRoutes.register,
            builder: (context, _) => RegisterScreen(
              controller: context.read<AuthController>(),
              onLoginTap: () => context.go(AppRoutes.login),
            ),
          ),
          GoRoute(
            path: AppRoutes.forgotPassword,
            builder: (context, _) => ForgotPasswordScreen(
              controller: context.read<AuthController>(),
            ),
          ),
          GoRoute(
            path: AppRoutes.resetPassword,
            builder: (context, _) => ResetPasswordScreen(
              controller: context.read<AuthController>(),
            ),
          ),
          ...legalRoutes(),
          // Oturum açmış kullanıcının tüm ekranları: controller'lar bu
          // kabukta oluşturulup Provider ile alt rotalara sağlanır.
          ShellRoute(
            builder: (context, state, child) =>
                AuthenticatedShell(child: child),
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (_, __) => const AppShell(),
              ),
              ...contentRoutes(),
            ],
          ),
        ],
      );

  static String? _redirect(AuthController auth, String loc) {
    // Oturumdan bağımsız, zorunlu tek-ekran durumları önce gelir.
    final forced = auth.initialized
        ? (auth.passwordRecoveryMode
            ? AppRoutes.resetPassword
            : (auth.onboardingNeeded ? AppRoutes.onboarding : null))
        : AppRoutes.splash;
    if (forced != null) return loc == forced ? null : forced;
    return switch (auth.status) {
      AuthStatus.unknown => AppRoutes.splash,
      AuthStatus.unauthenticated =>
        AppRoutes.publicPaths.contains(loc) ? null : AppRoutes.login,
      AuthStatus.authenticated =>
        _authOnlyRoutes.contains(loc) ? AppRoutes.home : null,
    };
  }

  /// Oturum açıkken anlamsız olan (giriş/kayıt/tanıtım vb.) rotalar.
  static const _authOnlyRoutes = {
    AppRoutes.login,
    AppRoutes.register,
    AppRoutes.forgotPassword,
    AppRoutes.resetPassword,
    AppRoutes.splash,
    AppRoutes.onboarding,
  };

  /// Oturum açmadan da erişilen yasal sayfalar.
  static List<RouteBase> legalRoutes() => [
        GoRoute(
          path: AppRoutes.privacyPolicy,
          builder: (_, __) => const PrivacyPolicyScreen(),
        ),
        GoRoute(
          path: AppRoutes.termsOfService,
          builder: (_, __) => const TermsOfServiceScreen(),
        ),
      ];

  /// Oturum açmış kullanıcının alt ekranları. Rota oluşturucular controller'ları
  /// kendi `BuildContext`'lerinden okur; bu yüzden `Builder` ile sarılırlar
  /// (GoRoute oluşturucusunun bağlamı sağlayıcıların üstünde kalır).
  ///
  /// Testler bu listeyi kendi sağlayıcılarının altında yeniden kullanabilir.
  static List<RouteBase> contentRoutes() => [
        ..._subscriptionRoutes(),
        ..._insightRoutes(),
        ..._settingsRoutes(),
      ];

  static List<RouteBase> _subscriptionRoutes() => [
        // Sıra önemli: sabit yollar `:id` yolundan önce tanımlanmalıdır.
        contentRoute(AppRoutes.addSubscription, (context, state) {
          final start =
              DateTime.tryParse(state.uri.queryParameters['start'] ?? '');
          return AddSubscriptionScreen(
            controller: context.read<SubscriptionController>(),
            initialStartDate: start,
          );
        }),
        contentRoute(
          AppRoutes.archivedSubscriptions,
          (context, _) => ArchivedSubscriptionsScreen(
            controller: context.read<SubscriptionController>(),
          ),
        ),
        contentRoute(
          AppRoutes.csvImport,
          (context, _) => CsvImportScreen(
            controller: context.read<SubscriptionController>(),
          ),
        ),
        contentRoute('/subscriptions/:id', (context, state) {
          final controller = context.read<SubscriptionController>();
          final sub = findSubscription(controller, state.pathParameters['id']);
          return sub == null
              ? const RouteNotFoundScreen()
              : SubscriptionDetailScreen(
                  subscription: sub, controller: controller);
        }),
        contentRoute('/subscriptions/:id/edit', (context, state) {
          final controller = context.read<SubscriptionController>();
          final sub = findSubscription(controller, state.pathParameters['id']);
          return sub == null
              ? const RouteNotFoundScreen()
              : EditSubscriptionScreen(
                  subscription: sub, controller: controller);
        }),
      ];

  /// Takvim, bildirim merkezi ve analiz ekranları.
  static List<RouteBase> _insightRoutes() => [
        contentRoute(
          AppRoutes.calendar,
          (context, _) => Scaffold(
            appBar: AppBar(title: const Text('Takvim')),
            body: CalendarScreen(
              controller: context.read<SubscriptionController>(),
            ),
          ),
        ),
        contentRoute(
          AppRoutes.notifications,
          (context, _) => NotificationCenterScreen(
            notificationController: context.read<NotificationController>(),
            subscriptionController: context.read<SubscriptionController>(),
          ),
        ),
        contentRoute(
          AppRoutes.stats,
          (context, _) =>
              StatsScreen(controller: context.read<SubscriptionController>()),
        ),
        contentRoute(
          AppRoutes.paymentHistory,
          (context, _) => PaymentHistoryScreen(
            controller: context.read<SubscriptionController>(),
          ),
        ),
        contentRoute(
          AppRoutes.savings,
          (context, _) =>
              SavingsScreen(controller: context.read<SubscriptionController>()),
        ),
      ];

  /// Profil, tercihler, gizlilik ve hesap ekranları.
  static List<RouteBase> _settingsRoutes() => [
        contentRoute(
          AppRoutes.profile,
          (context, _) => ProfileScreen(auth: context.read<AuthController>()),
        ),
        contentRoute(
          AppRoutes.notificationSettings,
          (context, _) => NotificationPreferencesScreen(
            controller: context.read<SettingsController>(),
          ),
        ),
        contentRoute(
          AppRoutes.paymentMethods,
          (context, _) => PaymentMethodsScreen(
            controller: context.read<SettingsController>(),
          ),
        ),
        contentRoute(
          AppRoutes.appearance,
          (context, _) =>
              AppearanceScreen(controller: context.read<SettingsController>()),
        ),
        contentRoute(
          AppRoutes.appLock,
          (context, _) =>
              AppLockSettingsScreen(service: context.read<AppLockService>()),
        ),
        contentRoute(
          AppRoutes.privacyCenter,
          (context, _) => PrivacyCenterScreen(
            auth: context.read<AuthController>(),
            subscriptions: context.read<SubscriptionController>(),
          ),
        ),
        contentRoute(AppRoutes.feedback, (_, __) => const FeedbackScreen()),
        contentRoute(
          AppRoutes.exportData,
          (context, _) => ExportDataScreen(
            subscriptions: context.read<SubscriptionController>(),
          ),
        ),
        contentRoute(
          AppRoutes.deleteAccount,
          (context, _) =>
              DeleteAccountScreen(auth: context.read<AuthController>()),
        ),
      ];
}

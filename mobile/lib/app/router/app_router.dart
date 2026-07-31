import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../shell/authenticated_shell.dart';
import '../splash_screen.dart';

class AppRouter {
  static GoRouter create(AuthController auth) => GoRouter(
        refreshListenable: auth,
        initialLocation: '/splash',
        redirect: (context, state) {
          final loc = state.matchedLocation;

          if (!auth.initialized) {
            return loc == '/splash' ? null : '/splash';
          }

          if (auth.passwordRecoveryMode) {
            return loc == '/reset-password' ? null : '/reset-password';
          }

          if (auth.onboardingNeeded) {
            return loc == '/onboarding' ? null : '/onboarding';
          }

          switch (auth.status) {
            case AuthStatus.unknown:
              return '/splash';
            case AuthStatus.unauthenticated:
              const publicRoutes = {'/login', '/register', '/forgot-password'};
              return publicRoutes.contains(loc) ? null : '/login';
            case AuthStatus.authenticated:
              const authOnlyRoutes = {'/login', '/register', '/forgot-password', '/reset-password', '/splash', '/onboarding'};
              return authOnlyRoutes.contains(loc) ? '/home' : null;
          }
        },
        routes: [
          GoRoute(
            path: '/splash',
            builder: (_, __) => const SplashScreen(),
          ),
          GoRoute(
            path: '/onboarding',
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
            path: '/login',
            builder: (context, _) => LoginScreen(
              controller: context.read<AuthController>(),
              onRegisterTap: () => context.go('/register'),
            ),
          ),
          GoRoute(
            path: '/register',
            builder: (context, _) => RegisterScreen(
              controller: context.read<AuthController>(),
              onLoginTap: () => context.go('/login'),
            ),
          ),
          GoRoute(
            path: '/forgot-password',
            builder: (context, _) => ForgotPasswordScreen(
              controller: context.read<AuthController>(),
            ),
          ),
          GoRoute(
            path: '/reset-password',
            builder: (context, _) => ResetPasswordScreen(
              controller: context.read<AuthController>(),
            ),
          ),
          GoRoute(
            path: '/home',
            builder: (_, __) => const AuthenticatedShell(),
          ),
        ],
      );
}

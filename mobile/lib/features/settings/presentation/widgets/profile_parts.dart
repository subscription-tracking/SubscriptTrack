import 'package:flutter/material.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({
    super.key,
    required this.email,
    required this.displayName,
    required this.memberSince,
  });

  final String email;
  final String? displayName;
  final String memberSince;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final small = Theme.of(context).textTheme.bodySmall;
    final initial = (displayName?.isNotEmpty == true ? displayName! : email)[0];
    return Column(
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: colors.primaryContainer,
          child: Text(
            initial.toUpperCase(),
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: colors.onPrimaryContainer,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(email, style: small),
        const SizedBox(height: 2),
        Text('Üye olma: $memberSince', style: small),
      ],
    );
  }
}

/// İşlem sürerken düğme pasif olur ve etiket yerine ilerleme göstergesi çıkar.
class ProfileBusyButton extends StatelessWidget {
  const ProfileBusyButton({
    super.key,
    required this.label,
    required this.busy,
    required this.onPressed,
  });

  final String label;
  final bool busy;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: busy ? null : onPressed,
      child: busy
          ? const SizedBox(
              height: 18,
              width: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Text(label),
    );
  }
}

class ProfileVisibilityToggle extends StatelessWidget {
  const ProfileVisibilityToggle(
      {super.key, required this.obscured, required this.onPressed});

  final bool obscured;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(
          obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined),
      onPressed: onPressed,
    );
  }
}

import 'package:flutter/material.dart';

import '../../../auth/presentation/auth_controller.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({required this.auth, super.key});

  final AuthController auth;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _email;
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();

  bool _savingName = false;
  bool _savingEmail = false;
  bool _changingPassword = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  String? _passwordError;

  @override
  void initState() {
    super.initState();
    final user = widget.auth.user;
    _name = TextEditingController(
      text: user?.displayName ?? user?.email.split('@').first ?? '',
    );
    _email = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _currentPassword.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  bool get _nameChanged {
    final user = widget.auth.user;
    final current = user?.displayName ?? user?.email.split('@').first ?? '';
    return _name.text.trim().isNotEmpty && _name.text.trim() != current;
  }

  bool get _emailChanged => _email.text.trim().toLowerCase() != widget.auth.user?.email.toLowerCase();

  bool get _canChangePassword =>
      _currentPassword.text.isNotEmpty &&
      _newPassword.text.length >= 6 &&
      _newPassword.text == _confirmPassword.text;

  Future<void> _saveName() async {
    setState(() => _savingName = true);
    final ok = await widget.auth.updateDisplayName(_name.text.trim());
    if (!mounted) return;
    setState(() => _savingName = false);
    if (ok) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('İsim güncellendi.')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.auth.error ?? 'İsim güncellenemedi.')),
      );
      widget.auth.clearError();
    }
  }

  Future<void> _saveEmail() async {
    setState(() => _savingEmail = true);
    final ok = await widget.auth.updateEmail(_email.text);
    if (!mounted) return;
    setState(() => _savingEmail = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'E-posta güncellendi. Supabase ayarına göre doğrulama istenebilir.' : (widget.auth.error ?? 'E-posta güncellenemedi.')),
    ));
    if (!ok) widget.auth.clearError();
  }

  Future<void> _changePassword() async {
    setState(() {
      _changingPassword = true;
      _passwordError = null;
    });
    final ok = await widget.auth.changePassword(
      currentPassword: _currentPassword.text,
      newPassword: _newPassword.text,
    );
    if (!mounted) return;
    setState(() => _changingPassword = false);
    if (ok) {
      _currentPassword.clear();
      _newPassword.clear();
      _confirmPassword.clear();
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Şifren başarıyla güncellendi.')));
    } else {
      setState(
          () => _passwordError = widget.auth.error ?? 'Şifre değiştirilemedi.');
      widget.auth.clearError();
    }
  }

  String _formatDate(DateTime d) => '${d.day}/${d.month}/${d.year}';

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final user = widget.auth.user;
    if (user == null) return const SizedBox.shrink();

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: CircleAvatar(
              radius: 40,
              backgroundColor: colors.primaryContainer,
              child: Text(
                (user.displayName?.isNotEmpty == true
                        ? user.displayName!
                        : user.email)[0]
                    .toUpperCase(),
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: colors.onPrimaryContainer,
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              user.email,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: 2),
          Center(
            child: Text(
              'Üye olma: ${_formatDate(user.createdAt)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: 28),
          Text('İsim', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          TextField(
            controller: _name,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.person_outline),
              hintText: 'Adın',
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: (_nameChanged && !_savingName) ? _saveName : null,
            child: _savingName
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Kaydet'),
          ),
          const SizedBox(height: 28),
          Text('E-posta', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.email_outlined),
              helperText: 'Supabase e-posta doğrulaması açıksa yeni adrese onay gönderilir.',
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: (_emailChanged && !_savingEmail) ? _saveEmail : null,
            child: _savingEmail ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('E-postayı güncelle'),
          ),
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 20),
          Text('Şifre değiştir', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 12),
          TextField(
            controller: _currentPassword,
            obscureText: _obscureCurrent,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Mevcut şifre',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_obscureCurrent
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined),
                onPressed: () =>
                    setState(() => _obscureCurrent = !_obscureCurrent),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _newPassword,
            obscureText: _obscureNew,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Yeni şifre (en az 6 karakter)',
              prefixIcon: const Icon(Icons.lock_reset_outlined),
              suffixIcon: IconButton(
                icon: Icon(_obscureNew
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined),
                onPressed: () => setState(() => _obscureNew = !_obscureNew),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _confirmPassword,
            obscureText: _obscureNew,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Yeni şifre (tekrar)',
              prefixIcon: const Icon(Icons.lock_reset_outlined),
              errorText: _passwordError,
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: (_canChangePassword && !_changingPassword)
                ? _changePassword
                : null,
            child: _changingPassword
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Şifreyi güncelle'),
          ),
        ],
      ),
    );
  }
}

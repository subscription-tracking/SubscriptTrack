import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../widgets/profile_parts.dart';

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

  bool get _emailChanged =>
      _email.text.trim().toLowerCase() != widget.auth.user?.email.toLowerCase();

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
      content: Text(ok
          ? 'E-posta güncellendi. Yeni adresine doğrulama bağlantısı gönderilebilir.'
          : (widget.auth.error ?? 'E-posta güncellenemedi.')),
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

  String _formatDate(DateTime d) => DateTimeUtils.formatLongDate(d);

  void _refresh() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final user = widget.auth.user;
    if (user == null) return const SizedBox.shrink();
    final titleSmall = Theme.of(context).textTheme.titleSmall;

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ProfileHeader(
            email: user.email,
            displayName: user.displayName,
            memberSince: _formatDate(user.createdAt),
          ),
          const SizedBox(height: 28),
          ..._nameSection(titleSmall),
          const SizedBox(height: 28),
          ..._emailSection(titleSmall),
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 20),
          Text('Şifre değiştir', style: titleSmall),
          const SizedBox(height: 12),
          _passwordFields(),
          const SizedBox(height: 12),
          ProfileBusyButton(
            label: 'Şifreyi güncelle',
            busy: _changingPassword,
            onPressed: _canChangePassword ? _changePassword : null,
          ),
        ],
      ),
    );
  }

  List<Widget> _nameSection(TextStyle? titleSmall) {
    return [
      Text('İsim', style: titleSmall),
      const SizedBox(height: 8),
      TextField(
        controller: _name,
        onChanged: (_) => _refresh(),
        decoration: const InputDecoration(
          prefixIcon: Icon(Icons.person_outline),
          hintText: 'Adın',
        ),
      ),
      const SizedBox(height: 12),
      ProfileBusyButton(
        label: 'Kaydet',
        busy: _savingName,
        onPressed: _nameChanged ? _saveName : null,
      ),
    ];
  }

  List<Widget> _emailSection(TextStyle? titleSmall) {
    return [
      Text('E-posta', style: titleSmall),
      const SizedBox(height: 8),
      TextField(
        controller: _email,
        keyboardType: TextInputType.emailAddress,
        onChanged: (_) => _refresh(),
        decoration: const InputDecoration(
          prefixIcon: Icon(Icons.email_outlined),
          helperMaxLines: 3,
          helperText:
              'E-posta adresini doğrulaman istenirse yeni adresine bir bağlantı gönderilir.',
        ),
      ),
      const SizedBox(height: 12),
      ProfileBusyButton(
        label: 'E-postayı güncelle',
        busy: _savingEmail,
        onPressed: _emailChanged ? _saveEmail : null,
      ),
    ];
  }

  Widget _passwordFields() {
    return Column(
      children: [
        TextField(
          controller: _currentPassword,
          obscureText: _obscureCurrent,
          onChanged: (_) => _refresh(),
          decoration: InputDecoration(
            labelText: 'Mevcut şifre',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: ProfileVisibilityToggle(
              obscured: _obscureCurrent,
              onPressed: () =>
                  setState(() => _obscureCurrent = !_obscureCurrent),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _newPassword,
          obscureText: _obscureNew,
          onChanged: (_) => _refresh(),
          decoration: InputDecoration(
            labelText: 'Yeni şifre (en az 6 karakter)',
            prefixIcon: const Icon(Icons.lock_reset_outlined),
            suffixIcon: ProfileVisibilityToggle(
              obscured: _obscureNew,
              onPressed: () => setState(() => _obscureNew = !_obscureNew),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _confirmPassword,
          obscureText: _obscureNew,
          onChanged: (_) => _refresh(),
          decoration: InputDecoration(
            labelText: 'Yeni şifre (tekrar)',
            prefixIcon: const Icon(Icons.lock_reset_outlined),
            errorText: _passwordError,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/config/app_environment.dart';
import '../../../../shared/design/responsive.dart';
import '../../data/support_catalog_api.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});
  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _message = TextEditingController();
  String _type = 'Özellik isteği';
  bool _sendingTicket = false;

  @override
  void initState() {
    super.initState();
    _message.addListener(_onMessageChanged);
  }

  void _onMessageChanged() => setState(() {});

  @override
  void dispose() {
    _message.removeListener(_onMessageChanged);
    _message.dispose();
    super.dispose();
  }

  Future<void> _share() async {
    await Share.share('SubscriptTrack $_type\n\n${_message.text.trim()}',
        subject: 'SubscriptTrack geri bildirimi');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Geri bildirim paylaşım ekranı açıldı.')));
    }
  }

  Future<void> _createTicket() async {
    if (!EnvironmentConfig.isSupabaseConfigured || Supabase.instance.client.auth.currentUser == null) return;
    setState(() => _sendingTicket = true);
    try {
      await SupportCatalogApi().createTicket(category: _type, message: _message.text.trim());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Destek kaydı oluşturuldu.')));
      if (mounted) _message.clear();
    } on FunctionException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Destek kaydı oluşturulamadı: ${e.details}')));
    } finally {
      if (mounted) setState(() => _sendingTicket = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Geri bildirim')),
        body: ResponsiveCenter(
          child: ListView(padding: const EdgeInsets.all(20), children: [
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Nasıl gönderilir?',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                    SizedBox(height: 6),
                    Text('Mesajını paylaşabilir veya Supabase hesabınla doğrudan destek kaydı oluşturabilirsin.'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Tür'),
                items: const [
                  DropdownMenuItem(
                      value: 'Özellik isteği', child: Text('Özellik isteği')),
                  DropdownMenuItem(
                      value: 'Hata bildirimi', child: Text('Hata bildirimi')),
                  DropdownMenuItem(
                      value: 'Genel öneri', child: Text('Genel öneri'))
                ],
                onChanged: (v) => setState(() => _type = v ?? _type)),
            const SizedBox(height: 16),
            TextField(
                controller: _message,
                minLines: 6,
                maxLines: 10,
                maxLength: 2000,
                decoration: InputDecoration(
                    labelText: 'Mesajın',
                    hintText: 'Ne geliştirebiliriz?',
                    helperText: _message.text.trim().isEmpty
                        ? 'Paylaşmak için mesaj yazmalısın.'
                        : 'Kategori ve mesaj paylaşım içeriğine eklenir.',
                    alignLabelWithHint: true)),
            const SizedBox(height: 16),
            FilledButton.icon(
                onPressed: _message.text.trim().isEmpty ? null : _share,
                icon: const Icon(Icons.share_outlined),
                label: const Text('Paylaşım ekranını aç')),
            if (EnvironmentConfig.isSupabaseConfigured && Supabase.instance.client.auth.currentUser != null) ...[
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _sendingTicket || _message.text.trim().isEmpty ? null : _createTicket,
                icon: _sendingTicket ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.support_agent_outlined),
                label: const Text('Destek kaydı oluştur'),
              ),
            ],
          ]),
        ),
      );
}

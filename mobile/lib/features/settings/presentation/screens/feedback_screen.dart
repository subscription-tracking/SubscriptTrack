import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});
  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _message = TextEditingController();
  String _type = 'Özellik isteği';

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _share() async {
    if (_message.text.trim().isEmpty) {
      return;
    }
    await Share.share('SubscriptTrack $_type\n\n${_message.text.trim()}',
        subject: 'SubscriptTrack geri bildirimi');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Geri bildirim paylaşım ekranı açıldı.')));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Geri bildirim')),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          const Text('Uygulamayı geliştirmemize yardım et.'),
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
              decoration: const InputDecoration(
                  labelText: 'Mesajın',
                  hintText: 'Ne geliştirebiliriz?',
                  alignLabelWithHint: true)),
          const SizedBox(height: 16),
          FilledButton.icon(
              onPressed: _share,
              icon: const Icon(Icons.share_outlined),
              label: const Text('Geri bildirimi paylaş')),
        ]),
      );
}

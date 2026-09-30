import 'package:flutter/material.dart';

import '../../../../shared/design/responsive.dart';
import '../../../../shared/widgets/loading_filled_button.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../subscription_controller.dart';
import 'subscription_form.dart';

/// Abonelik ekleme ve düzenleme ekranlarının ortak iskeleti: başlık, form
/// gövdesi ve sabit alt eylem çubuğu. Form içeriği sistem gezinmesinin altında
/// kalmasın diye eylem alanı [SafeArea] içinde tutulur.
class SubscriptionFormScaffold extends StatelessWidget {
  const SubscriptionFormScaffold({
    required this.title,
    required this.actionLabel,
    required this.controller,
    required this.formKey,
    required this.data,
    required this.settings,
    required this.onSave,
    this.showPresets = true,
    super.key,
  });

  final String title;
  final String actionLabel;
  final SubscriptionController controller;
  final GlobalKey<FormState> formKey;
  final SubscriptionFormData data;
  final AppPreferences settings;
  final VoidCallback onSave;
  final bool showPresets;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(20, 10, 20, 16),
        child: ListenableBuilder(
          listenable: controller,
          builder: (context, _) => LoadingFilledButton(
            label: actionLabel,
            loading: controller.loading,
            onPressed: onSave,
          ),
        ),
      ),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => ResponsiveCenter(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
            children: [
              SubscriptionForm(
                formKey: formKey,
                data: data,
                settings: settings,
                showPresets: showPresets,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Kaydetme hatasını gösterir ve denetleyicideki hatayı temizler.
void showFormSaveError(
    BuildContext context, SubscriptionController controller) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(controller.error ?? 'Bir hata oluştu.'),
      backgroundColor: Theme.of(context).colorScheme.error,
    ),
  );
  controller.clearError();
}

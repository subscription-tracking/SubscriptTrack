import { useThemeRevision } from '../../src/shared/design/useThemeRevision';
import { LegalDocumentView } from '../../src/shared/widgets/LegalDocumentView';
import { PRIVACY_POLICY } from '../../src/features/legal/domain/legalDocuments';

/** Gizlilik politikası. Oturum öncesi ve sonrası açık (yasal sayfalar kapıdan muaftır). */
export default function PrivacyPolicyRoute() {
  useThemeRevision();
  return <LegalDocumentView document={PRIVACY_POLICY} />;
}

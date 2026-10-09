import { LegalDocumentView } from '../../src/shared/widgets/LegalDocumentView';
import { TERMS_OF_SERVICE } from '../../src/features/legal/domain/legalDocuments';

/** Kullanım koşulları. Oturum öncesi ve sonrası açık (yasal sayfalar kapıdan muaftır). */
export default function TermsRoute() {
  return <LegalDocumentView document={TERMS_OF_SERVICE} />;
}

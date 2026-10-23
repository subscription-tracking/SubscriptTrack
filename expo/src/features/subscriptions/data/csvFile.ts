import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export async function pickCsvText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain'], copyToCacheDirectory: true,
  });
  return result.canceled || result.assets.length === 0 ? null : new File(result.assets[0].uri).text();
}

// utils/pdf.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateAttendancePDF = async (html: string) => {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
  return uri;
};

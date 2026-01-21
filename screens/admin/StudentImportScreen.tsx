// screens/admin/StudentImportScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import Card from '../../components/Card';
import { parseCSV } from '../../utils/csv';
import { parseExcel } from '../../utils/excel';
import { upsertStudent, upsertBatch, listStudentsByBatch } from '../../db/queries';
import { lightTheme } from '../../theme/light';
import { Ionicons } from '@expo/vector-icons';

type Row = { PRN: string; Name: string; Email?: string; Mobile?: string; ParentMobile?: string; BatchID?: string };

export default function StudentImportScreen() {
  const s = lightTheme;
  const [preview, setPreview] = useState<{ success: number; errors: { row: number; reason: string }[]; batches: Set<string> }>({ 
    success: 0, 
    errors: [], 
    batches: new Set() 
  });
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const pickFile = async () => {
    try {
      setLoading(true);
      const res = await DocumentPicker.getDocumentAsync({ 
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      });
      
      if (res.canceled) {
        setLoading(false);
        return;
      }
      
      const file = res.assets[0];
      setFileName(file.name);
      
      console.log('File picked:', file);
      
      let rows: any[] = [];
      
      if (file.mimeType?.includes('csv')) {
        const fileContent = await LegacyFileSystem.readAsStringAsync(file.uri);
        console.log('CSV content length:', fileContent.length);
        rows = await parseCSV(fileContent);
      } else if (file.mimeType?.includes('sheet') || file.name?.endsWith('.xlsx')) {
        try {
          let arrayBuffer: ArrayBuffer;
          
          try {
            const response = await fetch(file.uri);
            if (response.ok) {
              arrayBuffer = await response.arrayBuffer();
              console.log('Excel fetch success, bytes:', arrayBuffer.byteLength);
            } else {
              throw new Error('Fetch failed');
            }
          } catch (fetchError) {
            console.log('Trying alternative file reading method');
            const content = await LegacyFileSystem.readAsStringAsync(file.uri);
            const bytes = new Uint8Array(content.length);
            for (let i = 0; i < content.length; i++) {
              bytes[i] = content.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          }
          
          if (arrayBuffer.byteLength === 0) {
            throw new Error('Empty file content');
          }
          
          rows = await parseExcel(arrayBuffer);
          console.log('Excel parsed successfully, rows:', rows.length);
          
        } catch (excelError) {
          console.error('Excel processing error:', excelError);
          throw new Error('Failed to process Excel file. Please ensure it\'s a valid .xlsx file.');
        }
      } else {
        Alert.alert('Unsupported File', 'Please select a CSV or Excel (.xlsx) file.');
        setLoading(false);
        return;
      }
      
      if (rows.length === 0) {
        Alert.alert('No Data Found', 'The file appears to be empty or improperly formatted.');
        setLoading(false);
        return;
      }
      
      console.log('Sample row:', rows[0]);
      
      const errors: { row: number; reason: string }[] = [];
      const batchesCreated = new Set<string>();
      let success = 0;

      // Build existing PRN set
      const existingSet = new Set<string>();
      try {
        const existing = await listStudentsByBatch();
        existing.forEach((s: any) => existingSet.add(s.prn));
        console.log('Existing students:', existing.length);
      } catch (error) {
        console.error('Error loading existing students:', error);
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] as Row;
        const prn = (r.PRN || '').trim();
        const name = (r.Name || '').trim();
        const batchId = (r.BatchID || '').trim();

        if (!prn || !name) {
          errors.push({ row: i + 1, reason: 'Missing PRN or Name' });
          continue;
        }
        if (existingSet.has(prn)) {
          errors.push({ row: i + 1, reason: 'Duplicate PRN' });
          continue;
        }

        try {
          // Auto-create batch if BatchID is provided
          if (batchId) {
            await upsertBatch(batchId, batchId);
            batchesCreated.add(batchId);
          }
          
          await upsertStudent({
            prn, 
            name, 
            email: r.Email || '', 
            mobile: r.Mobile || '', 
            parentMobile: r.ParentMobile || '', 
            batchId: batchId || null,
          });
          
          existingSet.add(prn);
          success++;
          console.log(`Successfully imported student ${prn}`);
        } catch (error) {
          console.error(`Error importing row ${i + 1}:`, error);
          errors.push({ row: i + 1, reason: 'Database error' });
        }
      }

      setPreview({ success, errors, batches: batchesCreated });
      setLoading(false);
      
      Alert.alert(
        'Import Complete', 
        `✓ ${success} students imported successfully\n${errors.length > 0 ? `✗ ${errors.length} errors` : ''}\n${batchesCreated.size > 0 ? `📚 ${batchesCreated.size} batches created` : ''}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Import error:', error);
      setLoading(false);
      Alert.alert('Import Failed', `${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="cloud-upload-outline" size={48} color={s.colors.primary} />
        </View>
        <Text style={styles.title}>Import Students</Text>
        <Text style={styles.subtitle}>
          Upload CSV or Excel file with the following columns:{'\n'}
          <Text style={styles.fieldText}>PRN, Name, Email, Mobile, ParentMobile, BatchID</Text>
        </Text>
        
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={20} color={s.colors.primary} />
          <Text style={styles.noteText}>
            Batches will be created automatically based on BatchID column
          </Text>
        </View>
        
        <Pressable 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={pickFile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Select File</Text>
            </View>
          )}
        </Pressable>
        
        {fileName && (
          <View style={styles.fileNameBox}>
            <Ionicons name="document" size={16} color={s.colors.subtext} />
            <Text style={styles.fileName}>{fileName}</Text>
          </View>
        )}
      </Card>

      {(preview.success > 0 || preview.errors.length > 0) && (
        <Card style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="list-outline" size={24} color={s.colors.text} />
            <Text style={styles.sectionTitle}>Import Summary</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.successBox]}>
              <Ionicons name="checkmark-circle" size={32} color="#10B981" />
              <Text style={styles.statNumber}>{preview.success}</Text>
              <Text style={styles.statLabel}>Imported</Text>
            </View>
            
            <View style={[styles.statBox, styles.errorBox]}>
              <Ionicons name="close-circle" size={32} color={s.colors.danger} />
              <Text style={styles.statNumber}>{preview.errors.length}</Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
            
            <View style={[styles.statBox, styles.batchBox]}>
              <Ionicons name="albums" size={32} color={s.colors.primary} />
              <Text style={styles.statNumber}>{preview.batches.size}</Text>
              <Text style={styles.statLabel}>Batches</Text>
            </View>
          </View>

          {preview.batches.size > 0 && (
            <View style={styles.batchesList}>
              <Text style={styles.batchesTitle}>Batches Created:</Text>
              <View style={styles.batchTags}>
                {Array.from(preview.batches).map(batch => (
                  <View key={batch} style={styles.batchTag}>
                    <Text style={styles.batchTagText}>{batch}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {preview.errors.length > 0 && (
            <View style={styles.errorsList}>
              <Text style={styles.errorsTitle}>Errors:</Text>
              {preview.errors.slice(0, 10).map((e, idx) => (
                <View key={idx} style={styles.errorItem}>
                  <Ionicons name="alert-circle" size={16} color={s.colors.danger} />
                  <Text style={styles.errorText}>
                    Row {e.row}: {e.reason}
                  </Text>
                </View>
              ))}
              {preview.errors.length > 10 && (
                <Text style={styles.moreErrors}>
                  ... and {preview.errors.length - 10} more errors
                </Text>
              )}
            </View>
          )}
        </Card>
      )}
      
      <View style={styles.helpCard}>
        <Ionicons name="help-circle-outline" size={20} color={s.colors.subtext} />
        <Text style={styles.helpText}>
          Check browser console for detailed import logs
        </Text>
      </View>
    </ScrollView>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: s.colors.background 
  },
  scrollContent: {
    padding: s.spacing(2),
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: s.spacing(2),
  },
  headerIcon: {
    marginBottom: s.spacing(2),
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: s.colors.text,
    marginBottom: s.spacing(1),
  },
  subtitle: { 
    color: s.colors.subtext, 
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: s.spacing(2),
  },
  fieldText: {
    fontWeight: '600',
    color: s.colors.primary,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: s.colors.primary + '15',
    padding: s.spacing(1.5),
    borderRadius: s.radius.sm,
    marginBottom: s.spacing(2),
    gap: s.spacing(1),
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: s.colors.text,
  },
  button: { 
    backgroundColor: s.colors.primary, 
    borderRadius: s.radius.md, 
    padding: s.spacing(2.5), 
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(1),
  },
  buttonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '600',
    fontSize: 16,
  },
  fileNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s.spacing(2),
    padding: s.spacing(1),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.sm,
    gap: s.spacing(1),
  },
  fileName: {
    fontSize: 12,
    color: s.colors.subtext,
    fontStyle: 'italic',
  },
  previewCard: {
    marginBottom: s.spacing(2),
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1),
    marginBottom: s.spacing(2),
  },
  sectionTitle: { 
    fontWeight: '700',
    fontSize: 18,
    color: s.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: s.spacing(1.5),
    marginBottom: s.spacing(2),
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: s.spacing(2),
    borderRadius: s.radius.md,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98130',
  },
  errorBox: {
    backgroundColor: s.colors.danger + '15',
    borderColor: s.colors.danger + '30',
  },
  batchBox: {
    backgroundColor: s.colors.primary + '15',
    borderColor: s.colors.primary + '30',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: s.colors.text,
    marginTop: s.spacing(0.5),
  },
  statLabel: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
  },
  batchesList: {
    marginBottom: s.spacing(2),
  },
  batchesTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: s.colors.text,
    marginBottom: s.spacing(1),
  },
  batchTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.spacing(1),
  },
  batchTag: {
    backgroundColor: s.colors.primary,
    paddingHorizontal: s.spacing(1.5),
    paddingVertical: s.spacing(0.75),
    borderRadius: s.radius.sm,
  },
  batchTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorsList: {
    backgroundColor: s.colors.danger + '08',
    padding: s.spacing(1.5),
    borderRadius: s.radius.sm,
  },
  errorsTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: s.colors.danger,
    marginBottom: s.spacing(1),
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.spacing(1),
    marginBottom: s.spacing(0.75),
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: s.colors.danger,
  },
  moreErrors: {
    fontSize: 12,
    color: s.colors.subtext,
    fontStyle: 'italic',
    marginTop: s.spacing(0.5),
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(1),
    padding: s.spacing(1.5),
  },
  helpText: {
    fontSize: 12,
    color: s.colors.subtext,
    fontStyle: 'italic',
  },
});
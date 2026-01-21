// screens/followup/FollowUpScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { addFollowUp, listFollowUps } from '../../db/queries';
import Card from '../../components/Card';
import dayjs from 'dayjs';
import { lightTheme } from '../../theme/light';
import { Ionicons } from '@expo/vector-icons';

export default function FollowUpScreen({ route, navigation }: any) {
  const s = lightTheme;
  const { studentPrn, studentName } = route.params;
  const [proofPath, setProofPath] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const followUpHistory = await listFollowUps(studentPrn);
      setHistory(followUpHistory);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
      Alert.alert('Error', 'Failed to load follow-up history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const pickProof = async () => {
    try {
      setUploading(true);
      const res = await DocumentPicker.getDocumentAsync({ 
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });
      
      if (res.canceled) {
        setUploading(false);
        return;
      }

      const file = res.assets[0];

      // Check file size (2MB limit)
      if (file.size && file.size > 2 * 1024 * 1024) {
        setUploading(false);
        Alert.alert('File Too Large', 'Maximum file size is 2MB. Please choose a smaller file.');
        return;
      }

      // Save file to local directory
      const dest = `${LegacyFileSystem.documentDirectory}followup_${studentPrn}_${Date.now()}_${file.name}`;
      await LegacyFileSystem.copyAsync({ from: file.uri, to: dest });
      
      setProofPath(dest);
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: dest
      });
      
      setUploading(false);
      Alert.alert('Success', 'Proof document uploaded successfully');
    } catch (error) {
      setUploading(false);
      console.error('Error picking proof:', error);
      Alert.alert('Error', 'Failed to upload proof document');
    }
  };

  const save = async () => {
    if (!proofPath && !remarks.trim()) {
      Alert.alert('Validation Error', 'Please upload proof or add remarks');
      return;
    }

    setSaving(true);
    try {
      const date = dayjs().format('YYYY-MM-DD');
      await addFollowUp(studentPrn, date, proofPath, remarks.trim());
      
      // Reset form
      setProofPath('');
      setRemarks('');
      setSelectedFile(null);
      
      // Reload history
      await load();
      
      Alert.alert('Success', 'Follow-up record saved successfully');
    } catch (error) {
      console.error('Error saving follow-up:', error);
      Alert.alert('Error', 'Failed to save follow-up record');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = (path: string) => {
    const ext = path.toLowerCase();
    return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.gif');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="document-text" size={28} color={s.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Follow-up</Text>
            <Text style={styles.subtitle}>{studentName || studentPrn}</Text>
            <Text style={styles.prn}>PRN: {studentPrn}</Text>
          </View>
        </View>
      </Card>

      {/* Upload Proof Section */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Upload Absence Proof</Text>
        <Text style={styles.sectionSubtitle}>Maximum file size: 2MB • Formats: Image, PDF</Text>

        <Pressable 
          style={styles.uploadButton} 
          onPress={pickProof}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={s.colors.primary} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color={s.colors.primary} />
              <Text style={styles.uploadButtonText}>
                {selectedFile ? 'Change File' : 'Choose File'}
              </Text>
            </>
          )}
        </Pressable>

        {/* File Preview */}
        {selectedFile && (
          <View style={styles.filePreview}>
            {isImage(selectedFile.uri) ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.pdfPreview}>
                <Ionicons name="document" size={48} color={s.colors.primary} />
                <Text style={styles.pdfText}>PDF Document</Text>
              </View>
            )}
            
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
            </View>

            <Pressable 
              style={styles.removeFileButton}
              onPress={() => {
                setProofPath('');
                setSelectedFile(null);
              }}
            >
              <Ionicons name="close-circle" size={24} color={s.colors.danger} />
            </Pressable>
          </View>
        )}

        {/* Remarks Input */}
        <Text style={styles.inputLabel}>Remarks (Optional)</Text>
        <TextInput
          style={styles.remarksInput}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Add any notes or comments..."
          placeholderTextColor={s.colors.subtext}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Save Button */}
        <Pressable 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Follow-up</Text>
            </>
          )}
        </Pressable>
      </Card>

      {/* History Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.historyHeader}>
          <Ionicons name="time-outline" size={24} color={s.colors.text} />
          <Text style={styles.sectionTitle}>Follow-up History</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={s.colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="document-outline" size={48} color={s.colors.border} />
            <Text style={styles.emptyHistoryText}>No follow-up records yet</Text>
            <Text style={styles.emptyHistorySubtext}>Saved records will appear here</Text>
          </View>
        ) : (
          history.map((record, index) => (
            <View key={record.id} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <View style={styles.dateIcon}>
                  <Ionicons name="calendar" size={16} color={s.colors.primary} />
                </View>
                <Text style={styles.historyDate}>{dayjs(record.date).format('DD MMM YYYY')}</Text>
                {index === 0 && <Text style={styles.latestBadge}>Latest</Text>}
              </View>

              {record.remarks && (
                <View style={styles.remarksBox}>
                  <Ionicons name="chatbox-ellipses-outline" size={16} color={s.colors.subtext} />
                  <Text style={styles.historyRemarks}>{record.remarks}</Text>
                </View>
              )}

              {record.proofPath && (
                <View style={styles.proofContainer}>
                  {isImage(record.proofPath) ? (
                    <Image source={{ uri: record.proofPath }} style={styles.historyImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.historyPdf}>
                      <Ionicons name="document-text" size={32} color={s.colors.primary} />
                      <Text style={styles.historyPdfText}>PDF Attachment</Text>
                    </View>
                  )}
                </View>
              )}

              {!record.remarks && !record.proofPath && (
                <Text style={styles.noContent}>No additional information</Text>
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: s.colors.background 
  },
  headerCard: {
    margin: s.spacing(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: s.colors.text,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: s.colors.text,
    marginTop: 4,
  },
  prn: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: 2,
  },
  sectionCard: {
    marginHorizontal: s.spacing(2),
    marginBottom: s.spacing(2),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: s.colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
    marginBottom: s.spacing(2),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(1),
    padding: s.spacing(2.5),
    backgroundColor: s.colors.primary + '15',
    borderRadius: s.radius.md,
    borderWidth: 2,
    borderColor: s.colors.primary + '40',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: s.colors.primary,
  },
  filePreview: {
    marginTop: s.spacing(2),
    padding: s.spacing(2),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: s.radius.md,
    marginBottom: s.spacing(1.5),
  },
  pdfPreview: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: s.colors.primary + '10',
    borderRadius: s.radius.md,
    marginBottom: s.spacing(1.5),
  },
  pdfText: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.primary,
    marginTop: s.spacing(1),
  },
  fileInfo: {
    marginBottom: s.spacing(1),
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
  },
  fileSize: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: 2,
  },
  removeFileButton: {
    position: 'absolute',
    top: s.spacing(1),
    right: s.spacing(1),
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
    marginTop: s.spacing(2),
    marginBottom: s.spacing(1),
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: s.colors.border,
    borderRadius: s.radius.md,
    padding: s.spacing(2),
    fontSize: 14,
    color: s.colors.text,
    backgroundColor: s.colors.background,
    minHeight: 100,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(1),
    backgroundColor: s.colors.primary,
    borderRadius: s.radius.md,
    padding: s.spacing(2.5),
    marginTop: s.spacing(2),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1),
    marginBottom: s.spacing(2),
  },
  loadingContainer: {
    alignItems: 'center',
    padding: s.spacing(3),
  },
  loadingText: {
    marginTop: s.spacing(1),
    fontSize: 13,
    color: s.colors.subtext,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: s.spacing(3),
  },
  emptyHistoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: s.colors.subtext,
    marginTop: s.spacing(1.5),
  },
  emptyHistorySubtext: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
  },
  historyItem: {
    padding: s.spacing(2),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.md,
    marginBottom: s.spacing(1.5),
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1),
    marginBottom: s.spacing(1.5),
  },
  dateIcon: {
    width: 28,
    height: 28,
    borderRadius: s.radius.sm,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
    flex: 1,
  },
  latestBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#10B98120',
    paddingHorizontal: s.spacing(1),
    paddingVertical: 4,
    borderRadius: s.radius.sm,
  },
  remarksBox: {
    flexDirection: 'row',
    gap: s.spacing(1),
    padding: s.spacing(1.5),
    backgroundColor: s.colors.card,
    borderRadius: s.radius.sm,
    marginBottom: s.spacing(1.5),
  },
  historyRemarks: {
    flex: 1,
    fontSize: 13,
    color: s.colors.text,
    lineHeight: 18,
  },
  proofContainer: {
    marginTop: s.spacing(1),
  },
  historyImage: {
    width: '100%',
    height: 160,
    borderRadius: s.radius.md,
  },
  historyPdf: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: s.spacing(3),
    backgroundColor: s.colors.primary + '10',
    borderRadius: s.radius.md,
  },
  historyPdfText: {
    fontSize: 13,
    fontWeight: '600',
    color: s.colors.primary,
    marginTop: s.spacing(1),
  },
  noContent: {
    fontSize: 12,
    fontStyle: 'italic',
    color: s.colors.subtext,
  },
});
// screens/admin/BatchManagementScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, FlatList, RefreshControl } from 'react-native';
import Card from '../../components/Card';
import { lightTheme } from '../../theme/light';
import { listBatches, deleteBatch, listStudentsByBatch } from '../../db/queries';
import { Ionicons } from '@expo/vector-icons';

export default function BatchManagementScreen() {
  const s = lightTheme;
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const batchList = await listBatches();
    
    // Get student count for each batch
    const batchesWithCount = await Promise.all(
      batchList.map(async (batch) => {
        const students = await listStudentsByBatch(batch.batchId);
        return {
          ...batch,
          studentCount: students.length,
        };
      })
    );
    
    setBatches(batchesWithCount);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string, studentCount: number) => {
    Alert.alert(
      'Delete Batch', 
      `Are you sure you want to delete "${id}"?\n\n⚠️ This batch has ${studentCount} student${studentCount !== 1 ? 's' : ''}.\n\nNote: Students will NOT be deleted, only their batch assignment will be removed.`, 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => { 
            await deleteBatch(id); 
            await load();
            Alert.alert('Success', 'Batch deleted successfully');
          } 
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={64} color={s.colors.border} />
      <Text style={styles.emptyTitle}>No Batches Yet</Text>
      <Text style={styles.emptyText}>
        Batches will be created automatically when you import students with BatchID
      </Text>
    </View>
  );

  const renderBatchItem = ({ item }: any) => (
    <View style={styles.batchItem}>
      <View style={styles.batchIcon}>
        <Ionicons name="albums" size={24} color={s.colors.primary} />
      </View>
      
      <View style={styles.batchInfo}>
        <Text style={styles.batchName}>{item.batchName}</Text>
        <Text style={styles.batchId}>ID: {item.batchId}</Text>
        <View style={styles.studentCountBadge}>
          <Ionicons name="people" size={14} color={s.colors.primary} />
          <Text style={styles.studentCountText}>
            {item.studentCount} student{item.studentCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      <Pressable 
        style={styles.deleteButton}
        onPress={() => remove(item.batchId, item.studentCount)}
      >
        <Ionicons name="trash-outline" size={20} color={s.colors.danger} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="albums" size={28} color={s.colors.primary} />
            <View>
              <Text style={styles.title}>Batch Management</Text>
              <Text style={styles.subtitle}>{batches.length} batch{batches.length !== 1 ? 'es' : ''} total</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={s.colors.primary} />
          <Text style={styles.infoText}>
            Batches are created automatically during student import
          </Text>
        </View>
      </Card>

      <Card style={styles.listCard}>
        <FlatList
          data={batches}
          keyExtractor={(item) => item.batchId}
          renderItem={renderBatchItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} colors={[s.colors.primary]} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </Card>
    </View>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: s.colors.background, 
    padding: s.spacing(2) 
  },
  headerCard: {
    marginBottom: s.spacing(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.spacing(2),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: s.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: s.colors.subtext,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: s.colors.primary + '15',
    padding: s.spacing(1.5),
    borderRadius: s.radius.sm,
    gap: s.spacing(1),
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: s.colors.text,
  },
  listCard: {
    flex: 1,
    padding: 0,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s.spacing(2),
    gap: s.spacing(2),
  },
  batchIcon: {
    width: 48,
    height: 48,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: s.colors.text,
    marginBottom: 2,
  },
  batchId: {
    fontSize: 13,
    color: s.colors.subtext,
    marginBottom: s.spacing(0.5),
  },
  studentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: s.spacing(0.5),
  },
  studentCountText: {
    fontSize: 12,
    color: s.colors.primary,
    fontWeight: '500',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: s.radius.sm,
    backgroundColor: s.colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: s.colors.border,
    marginHorizontal: s.spacing(2),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: s.spacing(4),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: s.colors.text,
    marginTop: s.spacing(2),
  },
  emptyText: {
    fontSize: 14,
    color: s.colors.subtext,
    textAlign: 'center',
    marginTop: s.spacing(1),
    lineHeight: 20,
  },
});
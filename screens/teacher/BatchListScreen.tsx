// screens/teacher/BatchListScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { listBatches, listStudentsByBatch } from '../../db/queries';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/Card';
import { lightTheme } from '../../theme/light';
import { Ionicons } from '@expo/vector-icons';

interface BatchWithStudents {
  batchId: string;
  batchName: string;
  studentCount: number;
  expanded: boolean;
  students?: any[];
}

export default function BatchListScreen({ navigation }: any) {
  const s = lightTheme;
  const { user, logout } = useContext(AuthContext);
  const [batches, setBatches] = useState<BatchWithStudents[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const batchList = await listBatches();
      const batchesWithCount = await Promise.all(
        batchList.map(async (batch: any) => {
          const students = await listStudentsByBatch(batch.batchId);
          return {
            ...batch,
            studentCount: students.length,
            expanded: false,
          };
        })
      );
      setBatches(batchesWithCount);
    } catch (error) {
      console.error('Error loading batches:', error);
      Alert.alert('Error', 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const toggleBatch = async (batchId: string) => {
    const updatedBatches = await Promise.all(
      batches.map(async (batch) => {
        if (batch.batchId === batchId) {
          const isExpanding = !batch.expanded;
          let students = batch.students;
          
          if (isExpanding && !students) {
            students = await listStudentsByBatch(batchId);
          }
          
          return {
            ...batch,
            expanded: isExpanding,
            students,
          };
        }
        return batch;
      })
    );
    setBatches(updatedBatches);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => await logout()
        },
      ]
    );
  };

  const renderStudent = (student: any) => (
    <View key={student.prn} style={styles.studentItem}>
      <View style={styles.studentAvatar}>
        <Ionicons name="person" size={16} color={s.colors.primary} />
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentPrn}>{student.prn}</Text>
      </View>
    </View>
  );

  const renderBatch = ({ item }: { item: BatchWithStudents }) => (
    <Card style={styles.batchCard}>
      <Pressable 
        style={styles.batchHeader}
        onPress={() => toggleBatch(item.batchId)}
      >
        <View style={styles.batchIconContainer}>
          <Ionicons name="albums" size={32} color={s.colors.primary} />
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
        
        <View style={styles.batchActions}>
          <Pressable
            style={styles.markAttendanceBtn}
            onPress={() => navigation.navigate('Attendance', { 
              batchId: item.batchId,
              batchName: item.batchName 
            })}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.markAttendanceText}>Mark</Text>
          </Pressable>
          
          <Ionicons 
            name={item.expanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={s.colors.subtext}
            style={{ marginLeft: s.spacing(1) }}
          />
        </View>
      </Pressable>
      
      {item.expanded && item.students && (
        <View style={styles.studentsContainer}>
          <View style={styles.studentsHeader}>
            <Text style={styles.studentsTitle}>Students in this batch</Text>
            <Text style={styles.studentsCount}>{item.students.length}</Text>
          </View>
          {item.students.length > 0 ? (
            item.students.map(renderStudent)
          ) : (
            <View style={styles.noStudents}>
              <Ionicons name="person-outline" size={32} color={s.colors.border} />
              <Text style={styles.noStudentsText}>No students yet</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: s.colors.background }}>
      {/* Top Bar with Logout */}
      <View style={styles.topBar}>
        <View style={styles.userSection}>
          <View style={styles.userIcon}>
            <Ionicons name="person-circle" size={32} color={s.colors.primary} />
          </View>
          <View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={s.colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="albums" size={28} color={s.colors.primary} />
            <View>
              <Text style={styles.title}>All Batches</Text>
              <Text style={styles.subtitle}>{batches.length} batch{batches.length !== 1 ? 'es' : ''} available</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={s.colors.primary} />
          <Text style={styles.infoText}>
            Tap to expand and view students, or tap "Mark" to record attendance
          </Text>
        </View>
      </Card>

      {/* Batch List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={s.colors.primary} />
          <Text style={styles.loadingText}>Loading batches...</Text>
        </View>
      ) : batches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={64} color={s.colors.border} />
          <Text style={styles.emptyTitle}>No Batches Found</Text>
          <Text style={styles.emptyText}>No batches have been created yet</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item) => item.batchId}
          renderItem={renderBatch}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: s.colors.card,
    paddingHorizontal: s.spacing(2),
    paddingVertical: s.spacing(2),
    paddingTop: s.spacing(6),
    borderBottomWidth: 1,
    borderBottomColor: s.colors.border,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: s.colors.text,
  },
  userRole: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(0.75),
    paddingHorizontal: s.spacing(2),
    paddingVertical: s.spacing(1.25),
    backgroundColor: s.colors.danger + '15',
    borderRadius: s.radius.md,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.danger,
  },
  headerCard: {
    margin: s.spacing(2),
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
    fontSize: 12,
    color: s.colors.text,
    lineHeight: 16,
  },
  listContainer: {
    padding: s.spacing(2),
    paddingTop: 0,
  },
  batchCard: {
    marginBottom: s.spacing(2),
    overflow: 'hidden',
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
  },
  batchIconContainer: {
    width: 56,
    height: 56,
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
    fontWeight: '700',
    color: s.colors.text,
    marginBottom: 2,
  },
  batchId: {
    fontSize: 12,
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
    fontWeight: '600',
  },
  batchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(0.5),
    backgroundColor: s.colors.primary,
    paddingHorizontal: s.spacing(1.5),
    paddingVertical: s.spacing(1),
    borderRadius: s.radius.md,
  },
  markAttendanceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  studentsContainer: {
    marginTop: s.spacing(2),
    paddingTop: s.spacing(2),
    borderTopWidth: 1,
    borderTopColor: s.colors.border,
  },
  studentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.spacing(1.5),
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
  },
  studentsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: s.colors.primary,
    backgroundColor: s.colors.primary + '20',
    paddingHorizontal: s.spacing(1),
    paddingVertical: 4,
    borderRadius: s.radius.sm,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
    padding: s.spacing(1.5),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.sm,
    marginBottom: s.spacing(1),
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: s.radius.sm,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
  },
  studentPrn: {
    fontSize: 11,
    color: s.colors.subtext,
    marginTop: 2,
  },
  noStudents: {
    alignItems: 'center',
    padding: s.spacing(3),
  },
  noStudentsText: {
    fontSize: 13,
    color: s.colors.subtext,
    marginTop: s.spacing(1),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: s.spacing(4),
  },
  loadingText: {
    marginTop: s.spacing(2),
    fontSize: 14,
    color: s.colors.subtext,
  },
  emptyContainer: {
    flex: 1,
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
  },
});
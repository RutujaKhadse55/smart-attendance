// screens/batchTeacher/AbsentListScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Linking, Alert, ActivityIndicator, Platform } from 'react-native';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { listTeacherBatches, listAbsentByDateAndBatch } from '../../db/queries';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/Card';
import { lightTheme } from '../../theme/light';
import { Ionicons } from '@expo/vector-icons';

export default function AbsentListScreen({ navigation }: any) {
  const s = lightTheme;
  const { user, logout } = useContext(AuthContext);
  const [date, setDate] = useState(new Date());
  const [batchId, setBatchId] = useState<string>('');
  const [batches, setBatches] = useState<string[]>([]);
  const [absent, setAbsent] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (batchId) {
      loadAbsentStudents();
    }
  }, [date, batchId]);

  const loadBatches = async () => {
    try {
      const bs = await listTeacherBatches(user!.id);
      setBatches(bs);
      if (bs.length > 0) {
        setBatchId(bs[0]);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      Alert.alert('Error', 'Failed to load assigned batches');
    } finally {
      setLoading(false);
    }
  };

  const loadAbsentStudents = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const d = dayjs(date).format('YYYY-MM-DD');
      const absentList = await listAbsentByDateAndBatch(d, batchId);
      setAbsent(absentList);
    } catch (error) {
      console.error('Error loading absent students:', error);
      Alert.alert('Error', 'Failed to load absent students');
    } finally {
      setLoading(false);
    }
  };

  const callNumber = async (num?: string, type?: string) => {
    if (!num) {
      Alert.alert('No Number', `${type || 'Phone'} number not available for this student`);
      return;
    }

    const phoneNumber = num.replace(/[^0-9+]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calling is not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate phone call');
    }
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

  const isToday = dayjs(date).isSame(dayjs(), 'day');

  const renderStudent = ({ item }: any) => (
    <Card style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Ionicons name="person" size={24} color={s.colors.danger} />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentPrn}>{item.prn}</Text>
          {item.email && <Text style={styles.studentEmail}>{item.email}</Text>}
        </View>
        <View style={styles.absentBadge}>
          <Ionicons name="close-circle" size={16} color={s.colors.danger} />
          <Text style={styles.absentText}>Absent</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable 
          style={[styles.actionButton, styles.callStudentBtn]}
          onPress={() => callNumber(item.mobile, 'Student')}
        >
          <Ionicons name="call" size={18} color="#10B981" />
          <Text style={styles.actionButtonText}>Call Student</Text>
        </Pressable>

        <Pressable 
          style={[styles.actionButton, styles.callParentBtn]}
          onPress={() => callNumber(item.parentMobile, 'Parent')}
        >
          <Ionicons name="call" size={18} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Call Parent</Text>
        </Pressable>

        <Pressable 
          style={[styles.actionButton, styles.followUpBtn]}
          onPress={() => navigation.navigate('FollowUp', { studentPrn: item.prn, studentName: item.name })}
        >
          <Ionicons name="document-text" size={18} color="#8B5CF6" />
          <Text style={styles.actionButtonText}>Follow-up</Text>
        </Pressable>
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: s.colors.background }}>
      {/* Top Bar with Logout */}
      <View style={styles.topBar}>
        <View style={styles.userSection}>
          <Ionicons name="person-circle" size={32} color={s.colors.primary} />
          <View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={s.colors.danger} />
        </Pressable>
      </View>

      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={28} color={s.colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Absent Students</Text>
            <Text style={styles.subtitle}>Track and follow up with absent students</Text>
          </View>
        </View>

        {/* Date Selector */}
        <Pressable style={styles.dateSelector} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar" size={20} color={s.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>Selected Date</Text>
            <Text style={styles.dateText}>{dayjs(date).format('DD MMM YYYY')}</Text>
          </View>
          {isToday && <Text style={styles.todayBadge}>Today</Text>}
          <Ionicons name="chevron-down" size={20} color={s.colors.subtext} />
        </Pressable>

        {/* Batch Selector */}
        {batches.length > 1 && (
          <View style={styles.batchSelector}>
            <Text style={styles.selectorLabel}>Select Batch:</Text>
            <View style={styles.batchTabs}>
              {batches.map(b => (
                <Pressable 
                  key={b}
                  style={[styles.batchTab, batchId === b && styles.batchTabActive]}
                  onPress={() => setBatchId(b)}
                >
                  <Text style={[styles.batchTabText, batchId === b && styles.batchTabTextActive]}>
                    {b}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="close-circle" size={32} color={s.colors.danger} />
            <Text style={styles.statNumber}>{absent.length}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>
      </Card>

      {/* Absent Students List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={s.colors.primary} />
          <Text style={styles.loadingText}>Loading absent students...</Text>
        </View>
      ) : !batchId ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={64} color={s.colors.border} />
          <Text style={styles.emptyTitle}>No Batches Assigned</Text>
          <Text style={styles.emptyText}>You don't have any batches assigned to you</Text>
        </View>
      ) : absent.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
          <Text style={[styles.emptyTitle, { color: '#10B981' }]}>All Present!</Text>
          <Text style={styles.emptyText}>No absent students for this date</Text>
        </View>
      ) : (
        <FlatList
          data={absent}
          keyExtractor={(item) => item.prn}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {showPicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          onChange={(_, d) => { 
            setShowPicker(false); 
            if (d) setDate(d); 
          }} 
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
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
  },
  userRole: {
    fontSize: 11,
    color: s.colors.subtext,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    margin: s.spacing(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
    marginBottom: s.spacing(2),
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
    padding: s.spacing(2),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.md,
    borderWidth: 1,
    borderColor: s.colors.border,
    marginBottom: s.spacing(2),
  },
  dateLabel: {
    fontSize: 11,
    color: s.colors.subtext,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: s.colors.text,
    marginTop: 2,
  },
  todayBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: s.colors.primary,
    backgroundColor: s.colors.primary + '20',
    paddingHorizontal: s.spacing(1),
    paddingVertical: 4,
    borderRadius: s.radius.sm,
  },
  batchSelector: {
    marginBottom: s.spacing(2),
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: s.colors.text,
    marginBottom: s.spacing(1),
  },
  batchTabs: {
    flexDirection: 'row',
    gap: s.spacing(1),
    flexWrap: 'wrap',
  },
  batchTab: {
    paddingHorizontal: s.spacing(2),
    paddingVertical: s.spacing(1),
    borderRadius: s.radius.md,
    backgroundColor: s.colors.background,
    borderWidth: 1,
    borderColor: s.colors.border,
  },
  batchTabActive: {
    backgroundColor: s.colors.primary,
    borderColor: s.colors.primary,
  },
  batchTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: s.colors.text,
  },
  batchTabTextActive: {
    color: '#fff',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    padding: s.spacing(2),
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: s.colors.text,
    marginTop: s.spacing(1),
  },
  statLabel: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
  },
  listContainer: {
    padding: s.spacing(2),
    paddingTop: 0,
  },
  studentCard: {
    marginBottom: s.spacing(2),
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
    marginBottom: s.spacing(2),
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: s.colors.text,
    marginBottom: 2,
  },
  studentPrn: {
    fontSize: 12,
    color: s.colors.subtext,
  },
  studentEmail: {
    fontSize: 11,
    color: s.colors.subtext,
    marginTop: 2,
  },
  absentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: s.colors.danger + '15',
    paddingHorizontal: s.spacing(1.5),
    paddingVertical: s.spacing(0.75),
    borderRadius: s.radius.md,
  },
  absentText: {
    fontSize: 12,
    fontWeight: '600',
    color: s.colors.danger,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: s.spacing(1),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(0.5),
    padding: s.spacing(1.5),
    borderRadius: s.radius.md,
    borderWidth: 1,
  },
  callStudentBtn: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98140',
  },
  callParentBtn: {
    backgroundColor: '#3B82F615',
    borderColor: '#3B82F640',
  },
  followUpBtn: {
    backgroundColor: '#8B5CF615',
    borderColor: '#8B5CF640',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: s.colors.text,
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
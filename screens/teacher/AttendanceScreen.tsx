// screens/teacher/AttendanceScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { listStudentsByBatch, markAttendance, getAttendanceByDate } from '../../db/queries';
import { AuthContext } from '../../context/AuthContext';
import AnimatedToggle from '../../components/AnimatedToggle';
import Card from '../../components/Card';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { lightTheme } from '../../theme/light';
import { Ionicons } from '@expo/vector-icons';

export default function AttendanceScreen({ route }: any) {
  const s = lightTheme;
  const { user, logout } = useContext(AuthContext);
  const { batchId, batchName } = route.params;
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map());
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [batchId, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentList = await listStudentsByBatch(batchId);
      const d = dayjs(date).format('YYYY-MM-DD');
      const attendanceRecords = await getAttendanceByDate(d);
      
      // Build attendance map
      const attendanceMap = new Map<string, boolean>();
      attendanceRecords.forEach((record: any) => {
        if (record.studentPrn) {
          attendanceMap.set(record.studentPrn, record.status === 'Present');
        }
      });
      
      setStudents(studentList);
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const onToggle = async (prn: string, present: boolean) => {
    try {
      setSaving(true);
      const d = dayjs(date).format('YYYY-MM-DD');
      await markAttendance(prn, d, present ? 'Present' : 'Absent', dayjs().toISOString());
      
      // Update local state
      const newAttendance = new Map(attendance);
      newAttendance.set(prn, present);
      setAttendance(newAttendance);
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setSaving(false);
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

  const markAllPresent = () => {
    Alert.alert(
      'Mark All Present',
      'Mark all students as present for this date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setSaving(true);
            for (const student of students) {
              await onToggle(student.prn, true);
            }
            setSaving(false);
          }
        }
      ]
    );
  };

  const markAllAbsent = () => {
    Alert.alert(
      'Mark All Absent',
      'Mark all students as absent for this date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setSaving(true);
            for (const student of students) {
              await onToggle(student.prn, false);
            }
            setSaving(false);
          }
        }
      ]
    );
  };

  const getStats = () => {
    let present = 0;
    let absent = 0;
    let unmarked = 0;

    students.forEach(student => {
      const status = attendance.get(student.prn);
      if (status === true) present++;
      else if (status === false) absent++;
      else unmarked++;
    });

    return { present, absent, unmarked, total: students.length };
  };

  const stats = getStats();
  const isToday = dayjs(date).isSame(dayjs(), 'day');

  const renderStudent = ({ item }: any) => {
    const isPresent = attendance.get(item.prn);
    const isMarked = isPresent !== undefined;

    return (
      <Card style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <View style={[styles.studentAvatar, { backgroundColor: isMarked ? (isPresent ? '#10B98120' : s.colors.danger + '20') : s.colors.border + '40' }]}>
            <Ionicons 
              name={isMarked ? (isPresent ? 'checkmark-circle' : 'close-circle') : 'person'} 
              size={24} 
              color={isMarked ? (isPresent ? '#10B981' : s.colors.danger) : s.colors.subtext}
            />
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentPrn}>{item.prn}</Text>
            {item.email && <Text style={styles.studentEmail}>{item.email}</Text>}
          </View>
        </View>
        <AnimatedToggle 
          value={isPresent || false} 
          onChange={(v) => onToggle(item.prn, v)} 
        />
      </Card>
    );
  };

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
        <View style={styles.batchHeader}>
          <View style={styles.batchIcon}>
            <Ionicons name="albums" size={28} color={s.colors.primary} />
          </View>
          <View style={styles.batchInfo}>
            <Text style={styles.batchTitle}>{batchName || batchId}</Text>
            <Text style={styles.batchSubtitle}>{students.length} students</Text>
          </View>
        </View>

        {/* Date Selector */}
        <Pressable style={styles.dateSelector} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar" size={20} color={s.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>Attendance Date</Text>
            <Text style={styles.dateText}>{dayjs(date).format('DD MMM YYYY')}</Text>
          </View>
          {isToday && <Text style={styles.todayBadge}>Today</Text>}
          <Ionicons name="chevron-down" size={20} color={s.colors.subtext} />
        </Pressable>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.present}</Text>
            <Text style={[styles.statLabel, { color: '#10B981' }]}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.absent}</Text>
            <Text style={[styles.statLabel, { color: s.colors.danger }]}>Absent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.unmarked}</Text>
            <Text style={styles.statLabel}>Unmarked</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickActionBtn} onPress={markAllPresent}>
            <Ionicons name="checkmark-done" size={18} color="#10B981" />
            <Text style={styles.quickActionText}>All Present</Text>
          </Pressable>
          <Pressable style={styles.quickActionBtn} onPress={markAllAbsent}>
            <Ionicons name="close" size={18} color={s.colors.danger} />
            <Text style={styles.quickActionText}>All Absent</Text>
          </Pressable>
        </View>
      </Card>

      {/* Student List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={s.colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={s.colors.border} />
          <Text style={styles.emptyTitle}>No Students Found</Text>
          <Text style={styles.emptyText}>This batch doesn't have any students yet</Text>
        </View>
      ) : (
        <FlatList
          data={students}
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

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
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
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
    marginBottom: s.spacing(2),
  },
  batchIcon: {
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
  batchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: s.colors.text,
    marginBottom: 2,
  },
  batchSubtitle: {
    fontSize: 13,
    color: s.colors.subtext,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s.spacing(2),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: s.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: s.colors.border,
  },
  quickActions: {
    flexDirection: 'row',
    gap: s.spacing(1.5),
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(0.75),
    padding: s.spacing(1.5),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.md,
    borderWidth: 1,
    borderColor: s.colors.border,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: s.colors.text,
  },
  listContainer: {
    padding: s.spacing(2),
    paddingTop: 0,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s.spacing(1.5),
    padding: s.spacing(2),
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: s.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
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
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: s.spacing(2),
  },
});
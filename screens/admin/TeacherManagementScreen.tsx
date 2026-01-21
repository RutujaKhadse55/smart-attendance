// screens/admin/TeacherManagementScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import Card from '../../components/Card';
import { lightTheme } from '../../theme/light';
import { createUser, listBatches, assignTeacherToBatch, listTeachers, getTeacherAssignments, removeTeacherFromBatch } from '../../db/queries';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherManagementScreen() {
  const s = lightTheme;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Attendance Teacher' | 'Batch Teacher'>('Attendance Teacher');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);

  const loadData = async () => {
    setBatches(await listBatches());
    const teacherList = await listTeachers();
    
    // Load assignments for each teacher
    const teachersWithAssignments = await Promise.all(
      teacherList.map(async (teacher: any) => {
        const assignments = await getTeacherAssignments(teacher.id);
        return {
          ...teacher,
          assignments,
        };
      })
    );
    
    setTeachers(teachersWithAssignments);
  };

  useEffect(() => { loadData(); }, []);

  const toggleBatchSelection = (batchId: string) => {
    const newSelection = new Set(selectedBatches);
    if (newSelection.has(batchId)) {
      newSelection.delete(batchId);
    } else {
      newSelection.add(batchId);
    }
    setSelectedBatches(newSelection);
  };

  const create = async () => {
    if (!username.trim()) {
      return Alert.alert('Validation Error', 'Please enter a username');
    }
    if (!password) {
      return Alert.alert('Validation Error', 'Please enter a password');
    }
    if (role === 'Batch Teacher' && selectedBatches.size === 0) {
      return Alert.alert('Validation Error', 'Please select at least one batch for Batch Teacher');
    }

    try {
      setLoading(true);
      const id = await createUser(username.trim(), password, role);
      
      // Assign selected batches to Batch Teacher
      if (role === 'Batch Teacher') {
        for (const batchId of selectedBatches) {
          await assignTeacherToBatch(Number(id), batchId);
        }
      }
      
      setUsername('');
      setPassword('');
      setSelectedBatches(new Set());
      setRole('Attendance Teacher');
      await loadData();
      setLoading(false);
      
      Alert.alert(
        'Success', 
        `Teacher "${username}" created successfully${role === 'Batch Teacher' ? ` with ${selectedBatches.size} batch assignment${selectedBatches.size > 1 ? 's' : ''}` : ''}`
      );
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to create teacher');
    }
  };

  const removeAssignment = async (teacherId: number, batchId: string) => {
    Alert.alert(
      'Remove Assignment',
      `Remove this batch assignment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeTeacherFromBatch(teacherId, batchId);
            await loadData();
          }
        }
      ]
    );
  };

  const renderBatchSelector = ({ item }: any) => {
    const isSelected = selectedBatches.has(item.batchId);
    return (
      <Pressable
        style={[styles.batchOption, isSelected && styles.batchOptionSelected]}
        onPress={() => toggleBatchSelection(item.batchId)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={[styles.batchOptionText, isSelected && styles.batchOptionTextSelected]}>
          {item.batchName} ({item.batchId})
        </Text>
      </Pressable>
    );
  };

  const renderTeacherItem = ({ item }: any) => {
    const isExpanded = expandedTeacher === item.id;
    const hasAssignments = item.assignments && item.assignments.length > 0;
    
    return (
      <View style={styles.teacherItem}>
        <Pressable
          style={styles.teacherHeader}
          onPress={() => setExpandedTeacher(isExpanded ? null : item.id)}
        >
          <View style={styles.teacherIconContainer}>
            <Ionicons 
              name={item.role === 'Attendance Teacher' ? 'person-outline' : 'people-outline'} 
              size={24} 
              color={s.colors.primary} 
            />
          </View>
          
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName}>{item.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
            {item.role === 'Batch Teacher' && hasAssignments && (
              <Text style={styles.assignmentCount}>
                {item.assignments.length} batch{item.assignments.length > 1 ? 'es' : ''} assigned
              </Text>
            )}
          </View>
          
          {item.role === 'Batch Teacher' && hasAssignments && (
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={s.colors.subtext} 
            />
          )}
        </Pressable>
        
        {isExpanded && hasAssignments && (
          <View style={styles.assignmentsContainer}>
            <Text style={styles.assignmentsTitle}>Assigned Batches:</Text>
            {item.assignments.map((batch: any) => (
              <View key={batch.batchId} style={styles.assignmentItem}>
                <Ionicons name="albums" size={16} color={s.colors.primary} />
                <Text style={styles.assignmentText}>
                  {batch.batchName} ({batch.batchId})
                </Text>
                <Pressable
                  style={styles.removeAssignmentBtn}
                  onPress={() => removeAssignment(item.id, batch.batchId)}
                >
                  <Ionicons name="close-circle" size={20} color={s.colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.createCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-add-outline" size={24} color={s.colors.primary} />
          <Text style={styles.title}>Create Teacher Account</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Text style={styles.label}>Select Role:</Text>
        <View style={styles.roleSelector}>
          <Pressable
            style={[styles.roleOption, role === 'Attendance Teacher' && styles.roleOptionSelected]}
            onPress={() => {
              setRole('Attendance Teacher');
              setSelectedBatches(new Set());
            }}
          >
            <View style={styles.roleContent}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={role === 'Attendance Teacher' ? '#fff' : s.colors.text} 
              />
              <Text style={[styles.roleOptionText, role === 'Attendance Teacher' && styles.roleOptionTextSelected]}>
                Attendance Teacher
              </Text>
            </View>
            <Text style={[styles.roleDescription, role === 'Attendance Teacher' && styles.roleDescriptionSelected]}>
              Can view all batches and mark attendance
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.roleOption, role === 'Batch Teacher' && styles.roleOptionSelected]}
            onPress={() => setRole('Batch Teacher')}
          >
            <View style={styles.roleContent}>
              <Ionicons 
                name="people-outline" 
                size={20} 
                color={role === 'Batch Teacher' ? '#fff' : s.colors.text} 
              />
              <Text style={[styles.roleOptionText, role === 'Batch Teacher' && styles.roleOptionTextSelected]}>
                Batch Teacher
              </Text>
            </View>
            <Text style={[styles.roleDescription, role === 'Batch Teacher' && styles.roleDescriptionSelected]}>
              Can only view assigned batches
            </Text>
          </Pressable>
        </View>
        
        {role === 'Batch Teacher' && (
          <View style={styles.batchSelection}>
            <Text style={styles.label}>
              Assign Batches ({selectedBatches.size} selected):
            </Text>
            {batches.length === 0 ? (
              <View style={styles.noBatchesBox}>
                <Ionicons name="alert-circle-outline" size={20} color={s.colors.subtext} />
                <Text style={styles.noBatchesText}>No batches available. Import students first.</Text>
              </View>
            ) : (
              <FlatList
                data={batches}
                keyExtractor={(item) => item.batchId}
                renderItem={renderBatchSelector}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
        
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={create}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Create Teacher</Text>
            </View>
          )}
        </Pressable>
      </Card>
      
      <Card style={styles.listCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={24} color={s.colors.primary} />
          <Text style={styles.title}>Existing Teachers ({teachers.length})</Text>
        </View>
        
        {teachers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={s.colors.border} />
            <Text style={styles.emptyText}>No teachers created yet</Text>
          </View>
        ) : (
          <FlatList
            data={teachers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTeacherItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </Card>
    </ScrollView>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: s.colors.background,
    padding: s.spacing(2),
  },
  createCard: {
    marginBottom: s.spacing(2),
  },
  listCard: {
    marginBottom: s.spacing(2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1),
    marginBottom: s.spacing(2),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: s.colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.text,
    marginBottom: s.spacing(1),
    marginTop: s.spacing(1.5),
  },
  input: {
    borderWidth: 1,
    borderColor: s.colors.border,
    borderRadius: s.radius.md,
    padding: s.spacing(1.5),
    marginBottom: s.spacing(1.5),
    fontSize: 15,
    color: s.colors.text,
    backgroundColor: s.colors.background,
  },
  roleSelector: {
    gap: s.spacing(1.5),
    marginBottom: s.spacing(1.5),
  },
  roleOption: {
    borderWidth: 2,
    borderColor: s.colors.border,
    borderRadius: s.radius.md,
    padding: s.spacing(2),
  },
  roleOptionSelected: {
    backgroundColor: s.colors.primary,
    borderColor: s.colors.primary,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1),
  },
  roleOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: s.colors.text,
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  roleDescription: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
    marginLeft: s.spacing(3.5),
  },
  roleDescriptionSelected: {
    color: '#fff',
    opacity: 0.9,
  },
  batchSelection: {
    marginTop: s.spacing(1),
  },
  batchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s.spacing(1.5),
    borderWidth: 1,
    borderColor: s.colors.border,
    borderRadius: s.radius.sm,
    marginBottom: s.spacing(1),
    gap: s.spacing(1.5),
  },
  batchOptionSelected: {
    backgroundColor: s.colors.primary + '15',
    borderColor: s.colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: s.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: s.colors.primary,
    borderColor: s.colors.primary,
  },
  batchOptionText: {
    flex: 1,
    fontSize: 14,
    color: s.colors.text,
  },
  batchOptionTextSelected: {
    fontWeight: '600',
    color: s.colors.primary,
  },
  noBatchesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1),
    padding: s.spacing(2),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.sm,
  },
  noBatchesText: {
    flex: 1,
    fontSize: 13,
    color: s.colors.subtext,
  },
  button: {
    backgroundColor: s.colors.primary,
    borderRadius: s.radius.md,
    padding: s.spacing(2.5),
    marginTop: s.spacing(2),
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
  teacherItem: {
    marginBottom: s.spacing(1),
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s.spacing(2),
    gap: s.spacing(1.5),
  },
  teacherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: s.colors.text,
    marginBottom: s.spacing(0.5),
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: s.colors.primary + '20',
    paddingHorizontal: s.spacing(1),
    paddingVertical: s.spacing(0.5),
    borderRadius: s.radius.sm,
    marginTop: s.spacing(0.5),
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: s.colors.primary,
  },
  assignmentCount: {
    fontSize: 12,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
  },
  assignmentsContainer: {
    paddingHorizontal: s.spacing(2),
    paddingBottom: s.spacing(2),
    paddingTop: s.spacing(1),
    backgroundColor: s.colors.background,
    marginHorizontal: s.spacing(2),
    borderRadius: s.radius.sm,
  },
  assignmentsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: s.colors.subtext,
    marginBottom: s.spacing(1),
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s.spacing(1.5),
    backgroundColor: '#fff',
    borderRadius: s.radius.sm,
    marginBottom: s.spacing(0.75),
    gap: s.spacing(1),
  },
  assignmentText: {
    flex: 1,
    fontSize: 13,
    color: s.colors.text,
  },
  removeAssignmentBtn: {
    padding: s.spacing(0.5),
  },
  separator: {
    height: 1,
    backgroundColor: s.colors.border,
  },
  emptyState: {
    alignItems: 'center',
    padding: s.spacing(3),
  },
  emptyText: {
    fontSize: 14,
    color: s.colors.subtext,
    marginTop: s.spacing(1),
  },
});
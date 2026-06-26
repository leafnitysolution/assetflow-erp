import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { assetsApi, ticketsApi } from '../lib/api';

const TYPES = ['issue', 'maintenance', 'replacement', 'damage', 'lost'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function CreateTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ assetId?: string; assetName?: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('issue');
  const [priority, setPriority] = useState('medium');
  const [assetId, setAssetId] = useState(params.assetId ?? '');
  const [assetName, setAssetName] = useState(params.assetName ?? '');
  const [assets, setAssets] = useState<any[]>([]);
  const [showAssets, setShowAssets] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    assetsApi.getAll().then(setAssets).catch(() => {});
  }, []);

  const pickImage = async (fromCamera: boolean) => {
    if (attachments.length >= 3) { Alert.alert('Limit', 'Max 3 photos allowed.'); return; }
    const opt = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 as const, base64: true };
    let result;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission', 'Camera permission required.'); return; }
      result = await ImagePicker.launchCameraAsync(opt);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission', 'Gallery permission required.'); return; }
      result = await ImagePicker.launchImageLibraryAsync(opt);
    }
    if (!result.canceled && result.assets?.[0].base64) {
      setAttachments(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title.'); return; }
    if (description.trim().length < 15) { Alert.alert('Error', 'Description needs at least 15 characters.'); return; }
    setSubmitting(true);
    try {
      await ticketsApi.create({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        ...(assetId ? { assetId, assetName } : {}),
        attachments,
      });
      Alert.alert('Success', 'Ticket created!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#fafafa" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} placeholder="Short descriptive title…" placeholderTextColor="#525252" value={title} onChangeText={setTitle} />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="Describe the issue in detail…" placeholderTextColor="#525252" value={description} onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top" />
        </View>

        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TYPES.map(t => (
                <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, priority === p && styles.chipActive]} onPress={() => setPriority(p)}>
                <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Asset */}
        <View style={styles.field}>
          <Text style={styles.label}>Linked Asset (optional)</Text>
          <TouchableOpacity style={styles.assetSelector} onPress={() => setShowAssets(!showAssets)}>
            <Text style={assetName ? styles.assetSelectedText : styles.assetPlaceholder}>
              {assetName || 'Select asset…'}
            </Text>
          </TouchableOpacity>
          {showAssets && (
            <View style={styles.assetList}>
              {assets.map(a => (
                <TouchableOpacity key={a.id} style={styles.assetOption} onPress={() => { setAssetId(a.id); setAssetName(a.name); setShowAssets(false); }}>
                  <Text style={styles.assetOptionText}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Photos */}
        <View style={styles.field}>
          <Text style={styles.label}>Attachments ({attachments.length}/3)</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
              <Camera size={20} color="#a1a1a1" />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
              <ImageIcon size={20} color="#a1a1a1" />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {attachments.length > 0 && (
            <View style={styles.thumbRow}>
              {attachments.map((uri, i) => (
                <View key={i} style={styles.thumb}>
                  <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => setAttachments(p => p.filter((_, j) => j !== i))}>
                    <X size={12} color="#fafafa" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#09090b" /> : <Text style={styles.submitText}>Submit Ticket</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#fafafa' },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#a1a1a1' },
  input: { backgroundColor: '#171717', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#fafafa', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  textarea: { minHeight: 110, paddingTop: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#262626' },
  chipActive: { backgroundColor: '#00bc7d' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#a1a1a1' },
  chipTextActive: { color: '#09090b' },
  assetSelector: { backgroundColor: '#171717', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  assetSelectedText: { fontSize: 15, color: '#fafafa' },
  assetPlaceholder: { fontSize: 15, color: '#525252' },
  assetList: { backgroundColor: '#171717', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: 180, overflow: 'hidden' },
  assetOption: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  assetOptionText: { fontSize: 14, color: '#fafafa' },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#171717', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' },
  photoBtnText: { fontSize: 14, fontWeight: '500', color: '#a1a1a1' },
  thumbRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  thumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255,32,86,0.9)', borderRadius: 10, padding: 3 },
  submitBtn: { backgroundColor: '#00bc7d', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#09090b' },
});

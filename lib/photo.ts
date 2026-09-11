import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar uma imagem ao item.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.6,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

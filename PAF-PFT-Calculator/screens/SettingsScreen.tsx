import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_AGE = '@paf_pft_age';
const STORAGE_KEY_GENDER = '@paf_pft_gender';

const SettingsScreen = () => {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');

  // Load saved age and gender from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedAge = await AsyncStorage.getItem(STORAGE_KEY_AGE);
        const savedGender = await AsyncStorage.getItem(STORAGE_KEY_GENDER);
        if (savedAge) setAge(savedAge);
        if (savedGender) setGender(savedGender);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to AsyncStorage
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_AGE, age);
      await AsyncStorage.setItem(STORAGE_KEY_GENDER, gender);
      Alert.alert('Settings Saved', 'Your age and gender have been saved successfully.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <Text>Age:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
        placeholder="Enter your age"
      />

      <Text>Gender:</Text>
      <View style={styles.genderContainer}>
        <Button title="Male" onPress={() => setGender('male')} color={gender === 'male' ? 'blue' : 'gray'} />
        <Button title="Female" onPress={() => setGender('female')} color={gender === 'female' ? 'blue' : 'gray'} />
      </View>

      <Button title="Save Settings" onPress={saveSettings} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
});

export default SettingsScreen;

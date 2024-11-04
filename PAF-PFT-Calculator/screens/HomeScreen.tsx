import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define scoring ranges based on the table
const scoringRanges = {
  pushUps: {
    male: {
      '21': { min: 36, max: 80 },
      '22-26': { min: 35, max: 79 },
      '27-31': { min: 38, max: 77 },
      '32-36': { min: 29, max: 74 },
    },
    female: {
      '21': { min: 18, max: 64 },
      '22-26': { min: 16, max: 62 },
      '27-31': { min: 14, max: 59 },
      '32-36': { min: 12, max: 55 },
    },
  },
  sitUps: {
    male: {
      '21': { min: 36, max: 80 },
      '22-26': { min: 35, max: 79 },
      '27-31': { min: 38, max: 77 },
      '32-36': { min: 29, max: 74 },
    },
    female: {
      '21': { min: 18, max: 64 },
      '22-26': { min: 16, max: 62 },
      '27-31': { min: 14, max: 59 },
      '32-36': { min: 12, max: 55 },
    },
  },
  run: {
    male: {
      '21': { min: 18 * 60 + 43, max: 9 * 60 + 23 }, // Convert times to seconds
      '22-26': { min: 20 * 60 + 3, max: 10 * 60 + 43 },
      '27-31': { min: 22 * 60 + 3, max: 12 * 60 + 23 },
      '32-36': { min: 24 * 60 + 19, max: 14 * 60 + 59 },
    },
    female: {
      '21': { min: 20 * 60 + 19, max: 10 * 60 + 59 },
      '22-26': { min: 21 * 60 + 39, max: 12 * 60 + 19 },
      '27-31': { min: 22 * 60 + 59, max: 13 * 60 + 39 },
      '32-36': { min: 24 * 60 + 19, max: 14 * 60 + 59 },
    },
  },
};

const HomeScreen = ({ navigation }) => {
  const [pushUps, setPushUps] = useState(0);
  const [sitUps, setSitUps] = useState(0);
  const [runMinutes, setRunMinutes] = useState(0);
  const [runSeconds, setRunSeconds] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  // Load age and gender from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedAge = await AsyncStorage.getItem('@paf_pft_age');
        const savedGender = await AsyncStorage.getItem('@paf_pft_gender');
        if (savedAge) setAge(savedAge);
        if (savedGender) setGender(savedGender);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const calculateScore = () => {
    if (!age || !gender) {
      Alert.alert('Settings Required', 'Please set your age and gender in the settings.');
      navigation.navigate('Settings'); // Navigate to Settings Screen
      return;
    }

    const runTimeInSeconds = runMinutes * 60 + runSeconds;
    const ageGroup = '21'; // You may want to implement actual age group logic

    const pushUpScore = calculateEventScore(pushUps, scoringRanges.pushUps[gender][ageGroup]);
    const sitUpScore = calculateEventScore(sitUps, scoringRanges.sitUps[gender][ageGroup]);
    const runScore = calculateEventScore(runTimeInSeconds, scoringRanges.run[gender][ageGroup], true);

    const totalScore = (pushUpScore + sitUpScore + runScore) / 3;
    setScore(totalScore);
  };

  const calculateEventScore = (value: number, range: { min: number; max: number }, isRun: boolean = false): number => {
    const { min, max } = range;

    if (isRun) {
      if (value >= min) return 65;
      if (value <= max) return 100;
      return 65 + ((min - value) / (min - max)) * 35;
    } else {
      if (value <= min) return 65;
      if (value >= max) return 100;
      return 65 + ((value - min) / (max - min)) * 35;
    }
  };

  const saveSession = async () => {
    if (score === null) {
      Alert.alert('Calculate First', 'Please calculate your score before saving.');
      return;
    }

    try {
      const existingSessions = await AsyncStorage.getItem('@paf_pft_sessions');
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];
      const sessionData = {
        date: new Date().toISOString(),
        pushUpScore: pushUps,
        sitUpScore: sitUps,
        runTime: `${runMinutes}m ${runSeconds}s`,
        totalScore: score,
      };

      sessions.push(sessionData);
      await AsyncStorage.setItem('@paf_pft_sessions', JSON.stringify(sessions));
      Alert.alert('Success', 'Session saved successfully!');
    } catch (error) {
      console.error('Failed to save session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View >
          <Text style={styles.header}>PAF PFT Calculator</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Push-Ups (reps):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={pushUps.toString()}
              onChangeText={(value) => setPushUps(Number(value) || 0)}
              placeholder="Enter number of push-ups"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sit-Ups (reps):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={sitUps.toString()}
              onChangeText={(value) => setSitUps(Number(value) || 0)}
              placeholder="Enter number of sit-ups"
            />
          </View>

          <Text style={styles.label}>3.2 km Run - Time:</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInputContainer}>
              <Text>Minutes:</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={runMinutes.toString()}
                onChangeText={(value) => setRunMinutes(Number(value) || 0)}
              />
            </View>
            <View style={styles.timeInputContainer}>
              <Text>Seconds:</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={runSeconds.toString()}
                onChangeText={(value) => setRunSeconds(Number(value) || 0)}
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={calculateScore}>
              <Text style={styles.buttonText}>Calculate Score</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={saveSession}>
              <Text style={styles.buttonText}>Save Session</Text>
            </TouchableOpacity>
          </View>

          {score !== null && (
            <Text style={styles.result}>Your Total Score: {score.toFixed(2)}%</Text>
          )}

          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Progress')}>
              <Text style={styles.navButtonText}>View Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.navButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff', // White background for the whole screen
  },
  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff', // White background for the card
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
    alignItems: 'center', // Center content
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333', // Darker text color
    marginTop: 36
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    color: '#141414', // Text color for labels
  },
  inputContainer: {
    width: '100%',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DBE1E6',
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    backgroundColor: '#ffffff', // White background for input
    fontSize: 16,
    color: '#141414', // Darker text color
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#DBE1E6',
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    backgroundColor: '#ffffff', // White background for input
    fontSize: 16,
    color: '#141414', // Darker text color
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  navigationButtons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    
  },
  navButton: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  navButtonText: {
    color: '#141414',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

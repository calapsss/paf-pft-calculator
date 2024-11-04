import React, { useState } from 'react';
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

const HomeScreen = () => {
  const [pushUps, setPushUps] = useState(0);
  const [sitUps, setSitUps] = useState(0);
  const [runMinutes, setRunMinutes] = useState(0);
  const [runSeconds, setRunSeconds] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  // Key to store sessions in AsyncStorage
  const STORAGE_KEY = '@paf_pft_sessions';

  const calculateScore = () => {
    const runTimeInSeconds = runMinutes * 60 + runSeconds;

    // Example user data (these would ideally come from user input or settings)
    const ageGroup = '21'; // Replace with selected age group
    const gender = 'male'; // Replace with selected gender

    // Calculate scores for each event
    const pushUpScore = calculateEventScore(pushUps, scoringRanges.pushUps[gender][ageGroup]);
    const sitUpScore = calculateEventScore(sitUps, scoringRanges.sitUps[gender][ageGroup]);
    const runScore = calculateEventScore(runTimeInSeconds, scoringRanges.run[gender][ageGroup], true);

    // Calculate the average score across all events
    const totalScore = (pushUpScore + sitUpScore + runScore) / 3;
    setScore(totalScore);
  };

  // Helper function for interpolation
  const calculateEventScore = (value: number, range: { min: number; max: number }, isRun: boolean = false): number => {
    const { min, max } = range;

    // For the run event, lower times are better; flip logic accordingly
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

  // Save session to AsyncStorage
  const saveSession = async () => {
    if (score === null) {
      Alert.alert('Calculate First', 'Please calculate your score before saving.');
      return;
    }

    try {
      // Retrieve existing sessions
      const existingSessions = await AsyncStorage.getItem(STORAGE_KEY);
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];

      // Create session data
      const sessionData = {
        date: new Date().toISOString(),
        pushUpScore: pushUps,
        sitUpScore: sitUps,
        runTime: `${runMinutes}m ${runSeconds}s`,
        totalScore: score,
      };

      // Add the new session to the list
      sessions.push(sessionData);

      // Save updated sessions back to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
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
        <Text style={styles.header}>PAF PFT Calculator</Text>

        <Text>Push-Ups (reps):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={pushUps.toString()}
          onChangeText={(value) => setPushUps(Number(value) || 0)}
          placeholder="Enter number of push-ups"
        />

        <Text>Sit-Ups (reps):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={sitUps.toString()}
          onChangeText={(value) => setSitUps(Number(value) || 0)}
          placeholder="Enter number of sit-ups"
        />

        <Text>3.2 km Run - Time:</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeInputContainer}>
            <Text>Minutes:</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={() => setRunMinutes(Math.max(0, runMinutes - 1))} style={styles.button}>
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={runMinutes.toString()}
                onChangeText={(value) => setRunMinutes(Number(value) || 0)}
              />
              <TouchableOpacity onPress={() => setRunMinutes(runMinutes + 1)} style={styles.button}>
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.timeInputContainer}>
            <Text>Seconds:</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={() => setRunSeconds(Math.max(0, runSeconds - 1))} style={styles.button}>
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={runSeconds.toString()}
                onChangeText={(value) => setRunSeconds(Number(value) || 0)}
              />
              <TouchableOpacity onPress={() => setRunSeconds(runSeconds + 1)} style={styles.button}>
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Button title="Calculate Score" onPress={calculateScore} />
        
        {score !== null && (
            <>
            <Text style={styles.result}>Your Total Score: {score.toFixed(2)}%</Text>
            <Button title="Save Session" onPress={saveSession} />
            </>
        )}

        
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  timeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    width: 60,
    textAlign: 'center',
  },
  result: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;

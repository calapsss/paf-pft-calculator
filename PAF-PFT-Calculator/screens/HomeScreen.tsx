import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scoringRanges } from '../constants/scoringTables';
import Ionicons from '@expo/vector-icons/Ionicons';

const getAgeGroup = (age) => {
    const ageNum = parseInt(age, 10);
    if (ageNum < 22) return '21';
    if (ageNum <= 26) return '22-26';
    if (ageNum <= 31) return '27-31';
    if (ageNum <= 36) return '32-36';
    if (ageNum <= 41) return '37-41';
    if (ageNum <= 46) return '42-46';
    if (ageNum <= 51) return '47-51';
    if (ageNum <= 56) return '52-56';
    // Add more age groups as needed
    return '57-61'; // Default if age exceeds known groups
  };

const getRunAgeGroup = (age) => {
    const ageNum = parseInt(age,10);
    if (ageNum < 26) return '25 below';
    if (ageNum <= 30) return '26-30';
    if (ageNum <= 35) return '31-35';
    if (ageNum <= 40) return '36-40';
    if (ageNum <= 45) return '41-45';
    if (ageNum <= 50) return '46-50';
    if (ageNum <= 55) return '51-55';
    return '56-60';
}
  


const ScoreBar = ({ label, score }) => (
    <View style={styles.scoreContainer}>
      <View style={styles.scoreLabelContainer}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scorePercentage}>{`${score}%`}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${score}%`, backgroundColor: score >= 75 ? '#4CAF50' : '#FF3E3E' } // Green if 75% or above, red otherwise
        ]} />
      </View>
    </View>
  );


const HomeScreen = ({ navigation }) => {
  const [pushUps, setPushUps] = useState(0);
  const [sitUps, setSitUps] = useState(0);
  const [runMinutes, setRunMinutes] = useState(0);
  const [runSeconds, setRunSeconds] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [situpScore, setSitupScore] = useState<number | null>(null);
  const [pushupScore, setPushupScore] = useState<number | null>(null);
  const [runScore, setRunScore] = useState<number | null>(null);
  
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  // Load age and gender from AsyncStorage
  useFocusEffect(
    React.useCallback(() => {
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
    }, [])
  );
  

  const calculateRunScore = (runTimeInSeconds, ageGroup) => {
    const ranges = scoringRanges.run[gender][ageGroup];
    if (!ranges) return 50;  // Default if no ranges exist
    for (let i = 0; i < ranges.length; i++) {
        const { min, max, score } = ranges[i];
        if (runTimeInSeconds >= min && runTimeInSeconds <= max) {
            return score;
        }
    }
    return 50;  // Fallback if no match is found
};

  

  const calculateScore = () => {
    if (!age || !gender) {
      Alert.alert('Settings Required', 'Please set your age and gender in the settings.');
      navigation.navigate('Settings'); // Navigate to Settings Screen
      return;
    }
    console.log("Current Age:", age);
    console.log("Current Gender:", gender);
    const runTimeInSeconds = runMinutes * 60 + runSeconds;
    const ageGroup = getAgeGroup(age);
    const runAgeGroup = getRunAgeGroup(age);

    const pushUpScore = getEventScore(pushUps, scoringRanges.pushUps[gender][ageGroup]);
    const sitUpScore = getEventScore(sitUps, scoringRanges.sitUps[gender][ageGroup]);
    const runScore = calculateRunScore(runTimeInSeconds, runAgeGroup);

    console.log("Pushup table", scoringRanges.pushUps[gender][ageGroup]);
    console.log("Situp table", scoringRanges.sitUps[gender][ageGroup]);
    console.log("Run table", scoringRanges.run[gender][runAgeGroup]);

    const totalScore = (pushUpScore +sitUpScore +runScore) / 3;
    setSitupScore(sitUpScore);
    setPushupScore(pushUpScore);
    setRunScore(runScore);
    setScore(totalScore);
  };



  const getEventScore = (value, scoreTable) => {
    // Check if the value exceeds the highest score defined in the table
    const maxScore = Math.max(...Object.keys(scoreTable).map(Number));
    if (value >= maxScore) {
        return 100; // Return 100% if the value exceeds or meets the maximum score
    }

    // Check if the value is lower than the minimum defined score
    const minScore = Math.min(...Object.keys(scoreTable).map(Number));
    if (value < minScore) {
        return 0; // Return 0% for values below the minimum defined score
    }

    // If the value falls within the valid range, return the corresponding score
    return scoreTable[value] || 0; // Use the value as a key to access the score
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
          <Text style={styles.header}> PFT Calculator</Text>

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
            <TouchableOpacity style={styles.greyButton} onPress={saveSession}>
              <Text style={styles.greyButtonText}>Save Session</Text>
            </TouchableOpacity>
          </View>

          {score !== null && pushupScore !== null && situpScore !== null && runScore !== null && (
            <View style={styles.scoreCard}>
                <ScoreBar label="Push-Up Score" score={pushupScore.toFixed(2)} />
                <ScoreBar label="Sit-Up Score" score={situpScore.toFixed(2)} />
                <ScoreBar label="Run Score" score={runScore.toFixed(2)} />
                <Text style={styles.totalScoreText}>Your Total Score: {score.toFixed(2)}%</Text>
            </View>
          )}

          

          
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavBar}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
                <Ionicons name="home-outline" size={24} color="#007BFF" />
                <Text style={styles.hnavButtonText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Progress')}>
                <Ionicons name="bar-chart-outline" size={24} color="#333" />
                <Text style={styles.navButtonText}>View Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="cog-outline" size={24} color="#333" />
                <Text style={styles.navButtonText}>Settings</Text>
                </TouchableOpacity>
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
  scoreCard: {
    marginTop:20
  },
  scoreContainer: {
    marginVertical: 10,
  },
  scoreLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#333',
  },
  scorePercentage: {
    fontSize: 16,
    color: '#333',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007BFF',
  },
  totalScoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
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
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333', // Darker text color
    marginTop: 36,
    fontFamily: 'Inter-Black'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 36,
    textAlign: 'center',
    color: '#333', // Darker text color
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
  greyButton: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  greyButtonText: {
    color: '#141414',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  navButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  hnavButtonText: {
    fontSize: 12,
    color: '#007BFF',
    marginTop: 4,
  },
});

export default HomeScreen;

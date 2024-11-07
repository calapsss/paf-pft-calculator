import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from '@expo/vector-icons/Ionicons';


// Define the shape of a session object
interface Session {
  date: string;
  pushUpScore: number;
  sitUpScore: number;
  runTime: string;
  totalScore: number;
}

// Define the shape of the chart data
interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}


const STORAGE_KEY = '@paf_pft_sessions';

const ProgressScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [data, setData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }],
  });

  // Load sessions from AsyncStorage
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const storedSessions = await AsyncStorage.getItem(STORAGE_KEY);
        console.log('Raw stored sessions:', storedSessions); // Log the raw data
    
        // Check if storedSessions is null or empty
        if (!storedSessions) {
          console.log('No sessions found in AsyncStorage.'); // Log if no sessions
          Alert.alert('No Data', 'No saved sessions available.');
          return; // Early exit if there's no data
        }
    
        // Attempt to parse the JSON data
        const loadedSessions: Session[] = JSON.parse(storedSessions);
        
        // Check if loadedSessions is an array
        if (Array.isArray(loadedSessions)) {
          console.log('Loaded sessions:', loadedSessions);
          setSessions(loadedSessions);
          prepareChartData(loadedSessions);
        } else {
          console.log('Loaded sessions is not an array.');
          Alert.alert('Error', 'No valid sessions found.');
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        Alert.alert('Error', 'Failed to load sessions.');
      }
    };
    

    loadSessions();
  }, []);

  const prepareChartData = (loadedSessions: Session[]) => {
    if (!loadedSessions || loadedSessions.length === 0) {
      console.log('No sessions to prepare chart data from.');
      return;
    }

    const labels = loadedSessions.map(session => {
      const date = new Date(session.date);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
    });

    const scores = loadedSessions.map(session => {
      const score = Number(session.totalScore);
      return isNaN(score) ? 0 : score; // Use 0 if score is invalid
    });

    console.log('Chart labels:', labels);
    console.log('Chart scores:', scores);

    setData({
      labels,
      datasets: [{ data: scores }],
    });
  };

  // Delete a session
  const deleteSession = async (index: number) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedSessions = [...sessions];
            updatedSessions.splice(index, 1); // Remove the session at the given index
            setSessions(updatedSessions);
            prepareChartData(updatedSessions); // Update chart data

            // Save updated sessions back to AsyncStorage
            try {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
              Alert.alert("Session Deleted", "The session has been deleted successfully.");
            } catch (error) {
              console.error('Failed to delete session:', error);
            }
          }
        }
      ]
    );
  };

  // Render each session item
  const renderSession = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.sessionContainer}>
      <Text style={styles.sessionDate}>Date: {new Date(item.date).toLocaleDateString()}</Text>
      <Text>Push-Ups: {item.pushUpScore} reps</Text>
      <Text>Sit-Ups: {item.sitUpScore} reps</Text>
      <Text>Run Time: {item.runTime}</Text>
      <Text>Total Score: {item.totalScore.toFixed(2)}%</Text>
      <TouchableOpacity
        onPress={() => deleteSession(index)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Progress Tracker</Text>
      
      {data.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={data}
            width={400} // from react-native
            height={220}
            chartConfig={{
              backgroundColor: '#007bff', // Bootstrap primary blue
              backgroundGradientFrom: '#6cb2eb', // Lighter blue
              backgroundGradientTo: '#007bff', // Bootstrap primary blue
              decimalPlaces: 2, // optional, defaults to 2dp
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#007bff"
              }
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {sessions.length === 0 ? (
        <Text style={styles.noData}>No sessions saved yet.</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderSession}
        />
      )}
    

    {/* Bottom Navigation Bar */}
    <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
        <Ionicons name="home-outline" size={24} color="#333" />
        <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Progress')}>
        <Ionicons name="bar-chart-outline" size={24} color="#007BFF" />
        <Text style={styles.hnavButtonText}>View Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="cog-outline" size={24} color="#333" />
        <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>
    </View>

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
    marginTop: 36
  },
  sessionContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  sessionDate: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noData: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
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

export default ProgressScreen;

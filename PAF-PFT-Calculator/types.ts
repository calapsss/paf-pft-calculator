import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the types for each screen in the stack
export type RootStackParamList = {
  Home: undefined;
  Progress: undefined;
  Settings: undefined;
};

// Define props for each screen's navigation
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ProgressScreenProps = NativeStackScreenProps<RootStackParamList, 'Progress'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

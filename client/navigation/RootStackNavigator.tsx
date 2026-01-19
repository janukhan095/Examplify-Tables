import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import SubjectSelectScreen from "@/screens/SubjectSelectScreen";
import TopicSelectScreen from "@/screens/TopicSelectScreen";
import TestTakingScreen from "@/screens/TestTakingScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  SubjectSelect: { mode: "practice" | "mock" | "pyq" };
  TopicSelect: {
    subjectId: string;
    subjectName: string;
    mode: "practice" | "mock" | "pyq";
  };
  TestTaking: {
    topicId: string;
    topicName: string;
    mode: "practice" | "mock" | "pyq";
  };
  Results: {
    sessionId: string;
    summary: any;
    topicName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubjectSelect"
        component={SubjectSelectScreen}
        options={{
          headerTitle: "Select Subject",
        }}
      />
      <Stack.Screen
        name="TopicSelect"
        component={TopicSelectScreen}
        options={{
          headerTitle: "Select Topic",
        }}
      />
      <Stack.Screen
        name="TestTaking"
        component={TestTakingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

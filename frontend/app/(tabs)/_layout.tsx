import Feather from '@expo/vector-icons/Feather';
import IonIcons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FEAA00',
        tabBarInactiveTintColor: '#9B9B9B',
        tabBarStyle: { 
            height: 112,
            paddingTop: 8,
            paddingHorizontal: 8,
            flexDirection: 'row',
            justifyContent: 'space-evenly',

        }
      }}
    >
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />

      {/* TIMER TAB */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ size }) => (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 50,
                backgroundColor: '#FEAA00',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 40,
              }}
            >
              <Feather
                name="home"
                size={36}
                color="#fff"
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-bag" size={size} color={color} />
          ),
        }}
      />
    </Tabs>

    
  );
}
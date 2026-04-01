import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text } from 'react-native'

import { DonationsStack } from './DonationsStack'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'
import { EventsListScreen } from '../screens/EventsListScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ChartsScreen } from '../screens/ChartsScreen'
import { OperationLogScreen } from '../screens/OperationLogScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

export type MainTabsParamList = {
  Home: undefined
  Donations: undefined
  Events: undefined
  Charts: undefined
  Logs: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabsParamList>()

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: fontFamilies.semiBold,
        fontSize: 12,
        color: focused ? colors.primary : colors.mutedText,
      }}
    >
      {label}
    </Text>
  )
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        lazy: true,
        headerTitleStyle: { fontFamily: fontFamilies.semiBold },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: { backgroundColor: colors.header_sidebar_color },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Início" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Donations"
        component={DonationsStack}
        options={{
          title: 'Doações',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="gift" size={size} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Doações" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsListScreen}
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Eventos" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Charts"
        component={ChartsScreen}
        options={{
          title: 'Gráficos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Gráficos" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Logs"
        component={OperationLogScreen}
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Logs" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Perfil" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

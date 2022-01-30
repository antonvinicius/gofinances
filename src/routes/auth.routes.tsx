import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { Signin } from '../screens/Signin'

const Stack = createStackNavigator()

export function AuthRoutes() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name='SignIn' component={Signin} />
    </Stack.Navigator>
  )
}
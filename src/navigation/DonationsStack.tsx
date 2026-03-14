import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { fontFamilies } from '../theme/typography'
import { DonationsListScreen } from '../screens/DonationsListScreen'
import { DonationDetailScreen } from '../screens/DonationDetailScreen'

export type DonationsStackParamList = {
  DonationsList: undefined
  DonationDetail: { donationId: string }
}

const Stack = createNativeStackNavigator<DonationsStackParamList>()

export function DonationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontFamily: fontFamilies.semiBold },
      }}
    >
      <Stack.Screen
        name="DonationsList"
        component={DonationsListScreen}
        options={{ title: 'Doações' }}
      />
      <Stack.Screen
        name="DonationDetail"
        component={DonationDetailScreen}
        options={{ title: 'Detalhe da doação' }}
      />
    </Stack.Navigator>
  )
}

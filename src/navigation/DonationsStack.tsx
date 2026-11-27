import { AllocationQueueScreen } from '../screens/AllocationQueueScreen'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { fontFamilies } from '../theme/typography'
import { DonationsListScreen } from '../screens/DonationsListScreen'
import { DonationDetailScreen } from '../screens/DonationDetailScreen'
import { DonationCreateScreen } from '../screens/DonationCreateScreen'
import { DonationEditScreen } from '../screens/DonationEditScreen'
import { DonationAllocateScreen } from '../screens/DonationAllocateScreen'
import { DonationStockScreen } from '../screens/DonationStockScreen'
import { colors } from '../theme/colors'

export type DonationsStackParamList = {
  DonationsList: undefined
  DonationDetail: { donationId: string }
  DonationEdit: { donationId: string }
  DonationAllocate: { donationId: string; showSuggestions?: boolean }
  DonationStock: { donationId: string }
  DonationCreate: undefined
  AllocationQueue: { allocationId?: string } | undefined
}

const Stack = createNativeStackNavigator<DonationsStackParamList>()

export function DonationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontFamily: fontFamilies.semiBold },
        headerTintColor: colors.text,
        headerBackTitle: 'Voltar',
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
      <Stack.Screen
        name="DonationEdit"
        component={DonationEditScreen}
        options={{ title: 'Editar detalhes' }}
      />
      <Stack.Screen
        name="DonationAllocate"
        component={DonationAllocateScreen}
        options={{ title: 'Separar para a família' }}
      />
      <Stack.Screen
        name="DonationStock"
        component={DonationStockScreen}
        options={{ title: 'Ajustar estoque' }}
      />
      <Stack.Screen
        name="AllocationQueue"
        component={AllocationQueueScreen}
        options={{ title: 'Destinações' }}
      />
      <Stack.Screen
        name="DonationCreate"
        component={DonationCreateScreen}
        options={{ title: 'Nova doação' }}
      />
    </Stack.Navigator>
  )
}

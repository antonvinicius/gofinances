import React, { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { HistoryCard } from '../../components/HistoryCard'
import { categories } from '../../utils/categories'
import { useFocusEffect } from '@react-navigation/native'
import { VictoryPie } from 'victory-native'
import { RFValue } from 'react-native-responsive-fontsize'
import { useTheme } from 'styled-components'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { addMonths, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  ChartContainer,
  Container,
  Content,
  Header,
  Title,
  MonthSelect,
  MonthSelectButton,
  SelectIcon,
  Month,
  LoadingContainer,
} from './styles'
import { ActivityIndicator } from 'react-native'
import { useAuth } from '../../hooks/auth'

interface TransactionData {
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface CategoryData {
  name: string;
  color: string;
  total: number;
  totalFormatted: string;
  percent: string;
}

export function Resume() {
  const theme = useTheme()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  function handleDateChange(action: 'next' | 'prev') {
    if (action === 'next') {
      const newDate = addMonths(selectedDate, 1)
      setSelectedDate(newDate)
    } else {
      const newDate = subMonths(selectedDate, 1)
      setSelectedDate(newDate)
    }
  }

  async function loadData() {
    setIsLoading(true)
    const dataKey = `@gofinances:transactions_user:${user.id}`
    const response = await AsyncStorage.getItem(dataKey)
    const responseFormatted = response ? JSON.parse(response) : []

    const totalByCategory: CategoryData[] = []

    const expenses = responseFormatted
      .filter((expense: TransactionData) =>
        expense.type === 'negative' &&
        new Date(expense.date).getMonth() === selectedDate.getMonth() &&
        new Date(expense.date).getFullYear() === selectedDate.getFullYear()
      )

    const expensesTotal = expenses.reduce((acumulator: number, expensive: TransactionData) => {
      return acumulator + Number(expensive.amount)
    }, 0)

    categories.forEach(category => {
      let categorySum = 0

      expenses.forEach((expense: TransactionData) => {
        if (expense.category === category.key)
          categorySum += Number(expense.amount)
      })

      if (categorySum > 0) {

        const percent = `${(categorySum / expensesTotal * 100).toFixed(0)}%`

        totalByCategory.push({
          name: category.name,
          totalFormatted: categorySum.toLocaleString('pt-BR', { currency: 'BRL', style: 'currency' }),
          color: category.color,
          total: categorySum,
          percent
        })
      }
    })

    setTotalByCategories(totalByCategory)
    setIsLoading(false)
  }

  useFocusEffect(useCallback(() => {
    loadData()
  }, [selectedDate]))

  return (
    <Container>
      <Header>
        <Title>Resumo por categoria</Title>
      </Header>
      {
        isLoading ?
          <LoadingContainer>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </LoadingContainer> :
          <>
            <Content
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: useBottomTabBarHeight()
              }}
            >
              <MonthSelect>
                <MonthSelectButton onPress={() => handleDateChange('prev')}>
                  <SelectIcon name="chevron-left" />
                </MonthSelectButton>

                <Month>
                  {format(selectedDate, 'MMMM, yyyy', { locale: ptBR })}
                </Month>

                <MonthSelectButton onPress={() => handleDateChange('next')}>
                  <SelectIcon name="chevron-right" />
                </MonthSelectButton>
              </MonthSelect>

              <ChartContainer>
                <VictoryPie
                  data={totalByCategories}
                  colorScale={totalByCategories.map(category => category.color)}
                  style={{
                    labels: {
                      fontSize: RFValue(18),
                      fontWeight: 'bold',
                      fill: theme.colors.shape
                    }
                  }}
                  labelRadius={50}
                  x="percent"
                  y="total"
                />
              </ChartContainer>

              {
                totalByCategories.map(item => <HistoryCard
                  key={item.name}
                  title={item.name}
                  amount={item.totalFormatted}
                  color={item.color}
                />)
              }
            </Content>
          </>
      }
    </Container>
  )
}
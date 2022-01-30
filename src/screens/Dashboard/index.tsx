import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native';
import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadingContainer,
} from './styles'
import { ActivityIndicator } from 'react-native';
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighlightDataProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightData {
  entries: HighlightDataProps;
  expenses: HighlightDataProps;
  total: HighlightDataProps
}

export function Dashboard() {
  const theme = useTheme()
  const { signOut, user } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<DataListProps[]>([])
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData)

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'
  ) {
    if (collection.filter(item => item.type === 'positive').length === 0 && type === 'positive')
      return ''

    if (collection.filter(item => item.type === 'negative').length === 0 && type === 'negative')
      return ''

    const lastTransactionDate = new Date(
      Math.max.apply(Math, collection
        .filter((transaction) => transaction.type === type)
        .map((transaction) => new Date(transaction.date).getTime()))
    )

    return `${lastTransactionDate.getDate()} de ${lastTransactionDate.toLocaleString('pt-BR', { month: 'long' })}`
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`
    const response = await AsyncStorage.getItem(dataKey)
    const transactions = response ? JSON.parse(response) : []

    let entriesTotal = 0
    let expensesTotal = 0

    const transactionsFormatted: DataListProps[] = transactions
      .map((item: DataListProps) => {
        // Sum total of entries and expenses
        if (item.type === 'positive') {
          entriesTotal += Number(item.amount)
        } else {
          expensesTotal += Number(item.amount)
        }
        // Format amount
        const amount = Number(item.amount)
          .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })
        // Format Date
        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }).format(new Date(item.date))

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date,
        }
      })

    const total = entriesTotal - expensesTotal

    const lastEntries = getLastTransactionDate(transactions, 'positive')
    const lastExpenses = getLastTransactionDate(transactions, 'negative')
    let totalInterval = ''
    // Somente há entradas
    if (lastEntries != '' && lastExpenses === '') {
      totalInterval = `01 a ${lastEntries}`
    }
    // Não há entrdas e saídas
    else if (lastEntries === '' && lastExpenses === '') {
      totalInterval = 'Não há transações'
    }
    // Padrão período final é saídas
    else {
      totalInterval = `01 a ${lastExpenses}`
    }

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        lastTransaction: lastEntries != '' ? `Última entrada dia ${lastEntries}` : 'Não há transações'
      },
      expenses: {
        amount: expensesTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        lastTransaction: lastExpenses != '' ? `Última saída dia ${lastExpenses}` : 'Não há transações'
      },
      total: {
        amount: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        lastTransaction: totalInterval
      }
    })

    setTransactions(transactionsFormatted)
    setIsLoading(false)
  }

  useFocusEffect(useCallback(() => {
    loadTransactions()
  }, []))

  return (
    <Container>
      {isLoading ?
        <LoadingContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </LoadingContainer> :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo
                  source={{ uri: user.photo }}
                />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards>
            <HighlightCard
              type="up"
              title="Entradas"
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransaction}
            />
            <HighlightCard
              type="down"
              title="Saídas"
              amount={highlightData.expenses.amount}
              lastTransaction={highlightData.expenses.lastTransaction}
            />
            <HighlightCard
              type="total"
              title="Total"
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransaction}
            />
          </HighlightCards>

          <Transactions>
            <Title>Listagem</Title>

            <TransactionList
              data={transactions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      }
    </Container>
  )
}
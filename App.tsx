import { StyleSheet, Text, View } from 'react-native'
import React from 'react';
import Navigation from './src/Components/Navigation';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import allReducers from './src/Components/Redux/Reducer';
import Login from './src/Components/Login';

const store = createStore(allReducers);
const App = () => {
    return (
        <View style={{ flex: 1, }}>
            <Provider store={store}>
                <Navigation />
            </Provider>
        </View>
    )
}

export default App

const styles = StyleSheet.create({})
import { Provider } from "react-redux";
import { createStore } from "redux";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import allReducers from "./Components/Redux/Reducers";
import Navigation from "./Components/Navigation";
import { loadFonts } from "./Components/utils/Styles";
import { StatusBar, useColorScheme, View } from "react-native";
import ExpoStatusBar from "expo-status-bar/build/ExpoStatusBar";


// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create Redux store once
const store = createStore(allReducers);

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const isDarkMode = useColorScheme();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadFonts(); // Load fonts from Styles.js
      } catch (error) {
        console.warn("Error initializing app:", error);
      } finally {
        setAppIsReady(true); // Mark app as ready
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen when the app is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Render nothing while splash screen is visible
  }

  return (
    <View style={{ flex: 1 }}>
      <ExpoStatusBar
        style={isDarkMode === "dark" ? "light" : "dark"}
        translucent
        backgroundColor="transparent"
      />

      <Provider store={store}>

          <Navigation />

      </Provider>
    </View>
  );
}

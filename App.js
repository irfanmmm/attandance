import BottomTabNavigator from "./Components/BottomTabNavigator";
import { Provider } from "react-redux";
import { createStore } from "redux";
import allReducers from "./Components/Redux/Reducers";
import Toast from 'react-native-toast-message';

export default function App() {
  const store = createStore(allReducers);
  return (
    <Provider store={store}>
      <BottomTabNavigator />
      <Toast />
    </Provider>
  );
}

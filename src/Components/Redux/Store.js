import { createContext, useReducer } from "react";
import { Storage } from "../utils/Storage";
import Reducer from "./Reducer";

const loadInitialState = () => ({
  userData: JSON.parse(Storage.getItem("user_data") || "null") || {
    is_logged: false,
    access_token: null,
    refresh_token: null,
    company_code:'',
    empName:'',
    latitude:'', 
    longitude :''
    
  },
});
const Store = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, loadInitialState());
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
};

export const Context = createContext(null);

export default Store;
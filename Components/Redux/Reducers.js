  import { combineReducers } from "redux";

  const statusInOut = (state = "--", action) => {
    switch (action.type) {
      case "updateStatus":
        return action.data;
      default:
        return state;
    }
  };

  const userName = (state = "", action) => {
    switch (action.type) {
      case "setUser":
        return action.data;
      default:
        return state;
    }
  };

  const logIn = (state = '', action) => {
    switch (action.type) {
      case "loginSuccess":
        return action.data;
      case "logout":
        return action.data;
      default:
        return state;
    }
  };


  const appApiUrl = (state = "http://10.25.25.104:5001/", action) => {
    switch (action.type) {
      default:
        return state;
    }
  };

  const allReducers = combineReducers({ statusInOut, userName,logIn, appApiUrl });
  export default allReducers;


  
import {Storage as AsyncStorage} from '../utils/Storage'    

const Reducer =(state,action)=>{
    switch(action.type){
        case 'UPDATE_USER_DATA':
            const updateUserData = {...state.userData, ...action.userData};
            AsyncStorage.setItem('user_data', JSON.stringify(updateUserData));
            return {
                ...state,
                userData: updateUserData
            };
            default:
                return state;
    }

}

export default Reducer;
import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV();

export const Storage ={
    setItem:(key,value)=>storage.set(key,value),
    getItem:(key)=>storage.getString(key),
    removeItem:(key)=>storage.delete(key)
}

export default Storage
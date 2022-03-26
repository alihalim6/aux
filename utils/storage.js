import {AUX_NAMESPACE} from './constants';

export const storageGet = (item) => {
    return window.localStorage.getItem(AUX_NAMESPACE + item);
};

export const storageSet = (item, value) => {
    window.localStorage.setItem((AUX_NAMESPACE + item), value);
};

export const clearStorage = () => {
    window.localStorage.clear();
};
import {AUX_NAMESPACE} from './constants';

export const storageGet = (item) => {
  return localStorage.getItem(AUX_NAMESPACE + item);
};

export const storageGetAndRemove = (item) => {
  const itemToRemove = storageGet(item);
  localStorage.removeItem(AUX_NAMESPACE + item);
  return itemToRemove;
};

export const storageGetBoolean = (item) => {
  return localStorage.getItem(AUX_NAMESPACE + item) == 'true';
}

export const storageSet = (item, value) => {
  localStorage.setItem((AUX_NAMESPACE + item), value);
};

export const storageRemove = (item) => {
  localStorage.removeItem(AUX_NAMESPACE + item);
}

export const clearStorage = () => {
  Object.keys(localStorage).forEach(function(key){
    if(key.indexOf(AUX_NAMESPACE) == 0){
      localStorage.removeItem(key);
    }
  });
};
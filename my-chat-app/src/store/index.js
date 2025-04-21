import {configureStore} from '@reduxjs/toolkit';
import themeReducer from './themeslice';

const store = configureStore({
    reducer: {
        theme: themeReducer,
    },
});

export default store;
export {store};
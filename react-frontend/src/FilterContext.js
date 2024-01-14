// FilterContext.js
import React, { createContext, useContext, useReducer } from 'react';

const FilterContext = createContext();

const filterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.column]: action.value };
    default:
      return state;
  }
};

const FilterProvider = ({ children }) => {
  const [filters, dispatch] = useReducer(filterReducer, {});

  const setFilter = (column, value) => {
    dispatch({ type: 'SET_FILTER', column, value });
  };

  return (
    <FilterContext.Provider value={{ filters, setFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export { FilterProvider, useFilter };

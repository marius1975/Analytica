
 
import React, { useState, useEffect } from 'react';
import './App.css';
import CreateSchemaForm from './CreateSchemaForm';
import { FilterProvider } from './FilterContext';
import MainPage from './MainPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Callback function to handle login status
  const handleLoginStatus = (loginSuccessful) => {
    setIsLoggedIn(loginSuccessful);
  };

  // Function to handle logoff
  const handleLogoff = () => {
    setIsLoggedIn(false);
  };

  // Check if the user is authenticated when the component mounts
  useEffect(() => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    setIsLoggedIn(!!loggedInUserId);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {isLoggedIn ? (
          <FilterProvider>
            <CreateSchemaForm isLoggedIn={isLoggedIn} onLogoff={handleLogoff} />
          </FilterProvider>
        ) : (
          <MainPage onLogin={handleLoginStatus} />
        )}
      </header>
    </div>
  );
}

export default App;

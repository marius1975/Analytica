
/*

import React, { useState, useEffect } from 'react';
import './App.css';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';
import CreateSchemaForm from './CreateSchemaForm';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [schemas, setSchemas] = useState([]);

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  // Callback function to handle login status
  const handleLoginStatus = (loginSuccessful) => {
    if (loginSuccessful) {
      setIsLoggedIn(true);
    }
    // Handle login failure if needed
  };

  const handleCreateSchema = async (schemaName) => {
    try {
      // Send a POST request to create the schema
      const response = await fetch('http://localhost:8082/api/create-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: schemaName }),
      });

      if (response.ok) {
        console.log('Schema creation successful');
        // Update the schemas state with the newly created schema
        const newSchema = { name: schemaName };
        setSchemas([...schemas, newSchema]);
      } else {
        // Handle schema creation failure
        console.error('Schema creation failed');
      }
    } catch (error) {
      console.error(error);
    }
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
          <div>
            {*/
/* Pass isLoggedIn prop *//*
}
            <CreateSchemaForm onCreateSchema={handleCreateSchema} isLoggedIn={isLoggedIn} />
          </div>
        ) : (
          <div>
            {isLogin ? (
              <LoginForm onLogin={handleLoginStatus} onSwitchForm={handleToggleForm} />
            ) : (
              <RegistrationForm onLogin={handleToggleForm} />
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
*/
import React, { useState, useEffect } from 'react';
import './App.css';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';
import CreateSchemaForm from './CreateSchemaForm';
import { FilterProvider } from './FilterContext';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [schemas, setSchemas] = useState([]);

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  // Callback function to handle login status
  const handleLoginStatus = (loginSuccessful) => {
    if (loginSuccessful) {
      setIsLoggedIn(true);
    }
    // Handle login failure if needed
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
          <div>
            {/* Pass isLoggedIn prop */}
            <FilterProvider>
            <CreateSchemaForm isLoggedIn={isLoggedIn} />
            </FilterProvider>
          </div>
        ) : (
          <div>
            {isLogin ? (
              <LoginForm onLogin={handleLoginStatus} onSwitchForm={handleToggleForm} />
            ) : (
              <RegistrationForm onLogin={handleToggleForm} />
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

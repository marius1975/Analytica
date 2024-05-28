import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm({ onSwitchForm, onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
//handles the login option
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8082/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Login successful');
        // Call the parent component's callback to notify of successful login
        onLogin(true);
      } else {
        console.error('Login failed');
        // Call the parent component's callback to notify of login failure
        onLogin(false);
      }
    } catch (error) {
      console.error(error);
      // Call the parent component's callback to notify of login failure
      onLogin(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="LoginForm">
      <h1>Login</h1>
             <form onSubmit={handleSubmit}>
               <div>
                 <label htmlFor="username">Username:</label>
                 <input
                   type="text"
                   id="username"
                   name="username"
                   value={formData.username}
                   onChange={handleChange}
                   required
                 />
               </div>
               <div>
                 <label htmlFor="password">Password:</label>
                 <input
                   type="password"
                   id="password"
                   name="password"
                   value={formData.password}
                   onChange={handleChange}
                   required
                 />
               </div>
               <button type="submit">Login</button>
             </form>
             <button className="switch-button" onClick={onSwitchForm}>
               Switch to Registration
             </button>
    </div>
  );
}

export default LoginForm;

import React, { useState } from 'react';
import './RegistrationForm.css';

function RegistrationForm({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send a POST request for registration
      const response = await fetch('http://localhost:8082/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Registration successful');
        // Handle successful registration, e.g., show a success message
      } else {
        // Registration failed, handle errors
        console.error('Registration failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="RegistrationForm">
      <h1>Registration</h1>
      <form onSubmit={handleSubmit} >
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
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
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
        <div className="RegistrationForm-buttons">
          <button type="submit">Register</button>
          <button className="switch-button" onClick={onLogin}>Switch to Login</button>
        </div>
      </form>
    </div>
  );
}

export default RegistrationForm;

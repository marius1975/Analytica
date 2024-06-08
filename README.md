This project is a web application built using React that includes a main page displaying key features and "About Us" information.
Users can navigate to login and registration forms through the menu bar.

Table of Contents:
Features
Installation
Usage
Components
File Structure
Contributing
License
Repository
Features:
Home Page: Displays key features of the application.
About Us Page: Provides information about the application.
Login Page: Allows users to log in to their account.
Registration Page: Allows new users to register.
Installation
Clone the repository:
git clone [https://github.com/marius1975/Data_View]
Navigate to the project directory:
https://github.com/marius1975/Data_View
Install the dependencies:
npm install
Usage
Start the development server:
npm start
Open the application in your browser:
http://localhost:3000
Components
App.js
The main entry point of the application. 
It manages the state for login and registration, and conditionally renders the MainPage, LoginForm, and RegistrationForm components based on user actions.

import React, { useState, useEffect } from 'react';
import './App.css';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';
import CreateSchemaForm from './CreateSchemaForm';
import { FilterProvider } from './FilterContext';
import MainPage from './MainPage';

function App() {
const [isLogin, setIsLogin] = useState(true);
const [isLoggedIn, setIsLoggedIn] = useState(false);

const handleLoginStatus = (loginSuccessful) => {
if (loginSuccessful) {
setIsLoggedIn(true);
}
};

useEffect(() => {
const loggedInUserId = localStorage.getItem('loggedInUserId');
setIsLoggedIn(!!loggedInUserId);
}, []);

return (
<div className="App">
<header className="App-header">
<MainPage
isLogin={isLogin}
onLogin={handleLoginStatus}
onRegister={() => setIsLogin(false)}
/>
{isLoggedIn && (
<FilterProvider>
<CreateSchemaForm isLoggedIn={isLoggedIn} />
</FilterProvider>
)}
</header>
</div>
);
}

export default App;

MainPage.js
Displays the main content of the application, including a navigation menu for Home, About Us, Login, and Register.
It conditionally renders the LoginForm and RegistrationForm based on the state passed from App.js.

import React from 'react';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

const { Header, Content } = Layout;

const MainPage = ({ isLogin, onLogin, onRegister }) => {
return (
<Router>
<Layout style={{ minHeight: '100vh' }}>
<Header style={{ background: '#001529', color: 'white', textAlign: 'center' }}>
<Menu theme="dark" mode="horizontal" defaultSelectedKeys={['home']}>
<Menu.Item key="home"><Link to="/">Home</Link></Menu.Item>
<Menu.Item key="about"><Link to="/about">About Us</Link></Menu.Item>
<Menu.Item key="login"><Link to="/login">Login</Link></Menu.Item>
<Menu.Item key="register"><Link to="/register">Register</Link></Menu.Item>
</Menu>
</Header>

        <Content style={{ padding: '2rem' }}>
          <Switch>
            <Route path="/about">
              <h2>About Us</h2>
              {/* Add about us content here */}
            </Route>
            <Route path="/login">
              <LoginForm onLogin={onLogin} />
            </Route>
            <Route path="/register">
              <RegistrationForm onLogin={onRegister} />
            </Route>
            <Route path="/">
              <div>
                <h2>Key Features</h2>
                {/* Add key features content here */}
              </div>
            </Route>
          </Switch>
        </Content>
      </Layout>
    </Router>
);
};

export default MainPage;

LoginForm.js
Handles user login functionality.
import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm({ onLogin }) {
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
        onLogin(true);
      } else {
        console.error('Login failed');
        onLogin(false);
      }
    } catch (error) {
      console.error(error);
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
</div>
);
}

export default LoginForm;


RegistrationForm.js
Handles user registration functionality.

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
      const response = await fetch('http://localhost:8082/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Registration successful');
        onLogin();
      } else {
        console.error('Registration failed');
      }
    } catch (error) {
      console.error(error);
    }
};

return (
<div className="RegistrationForm">
<h1>Registration</h1>
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
</div>
</form>
</div>
);
}

export default RegistrationForm;

CreateSchemaForm.js

Handles various functionalities as database creation, upload files to the database and data visualization.

//Create a new database

const handleCreateDatabase = async () => {
if (!dbName) {
console.error('Database name cannot be empty');
return;
}

    try {
      const response = await fetch(`http://localhost:8082/api/create-database/${dbName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const createdDatabaseName = await response.text();
        console.log('Database created successfully:', createdDatabaseName);
        setDbName('');
        setDatabases([...databases, createdDatabaseName]);
      } else {
        console.error('Failed to create the database');
      }
    } catch (error) {
      console.error(error);
    }
};

//Uploads files to the newly created database

const handleFileUpload = async () => {
if (!selectedDatabase || !selectedFile) {
console.error('Please select a database and a file.');
return;
}

const formData = new FormData();
formData.append('file', selectedFile);

try {
const response = await fetch(`http://localhost:8082/api/upload-file/${selectedDatabase}`, {
method: 'POST',
body: formData,
});

    if (response.ok) {
      const result = await response.text();
      console.log(result);
      closeFileUploadModal();

      // Fetch the updated list of tables after successful file upload
      fetch(`http://localhost:8082/api/tables-in-database/${selectedDatabase}`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            throw new Error('Failed to retrieve tables');
          }
        })
        .then((data) => {
          setTablesInDatabase(data);
          setTableOrder(data);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error('Failed to upload file.');
    }
} catch (error) {
console.error('Error uploading file:', error);
}
};


//Extracts the data to be displayed.

const fetchTableData = async() => {
setIsFiltering(false);
try {
const response = await fetch(
`http://localhost:8082/api/get-table-data/${selectedDatabase}/${selectedTable}/${page}/${pageSize}`
);

      if ( response.ok) {
        const data = await response.json();

        setSelectedTableData(data);
        // Calculate total pages based on the total records and page size
                const totalRecords = await fetchTotalRecords();
                // Log the value to console for debugging
                console.log('Total Records:', totalRecords);

                const totalTablePages = isNaN(totalRecords) ? 0 :Math.ceil(totalRecords / pageSize);
                //const  totalTablePages = !isFiltering ? totalRecords : totalFilteredRecords ;

                console.log(`Pages 1 of ${totalTablePages}`);
                setTotalPages(totalTablePages);
      } else {
        console.error('Failed to fetch paginated table data.');
      }
    } catch (error) {
      console.error('Error while fetching paginated table data:', error);
    }
};
File Structure
java

project-directory/
│
├── public/
│   ├── index.html
│   └── ...
│
├── src/
│   ├── App.css
│   ├── App.js
│   ├── CreateSchemaForm.js
│   ├── FilterContext.js
│   ├── index.js
│   ├── LoginForm.css
│   ├── LoginForm.js
│   ├── MainPage.js
│   ├── RegistrationForm.css
│   ├── RegistrationForm.js
│   └── ...
│
├── package.json
└── README.md
Contributing
Contributions are welcome! Please open an issue or submit a pull request to discuss changes.

License
This project is licensed 

Repository
Find the project repository at: https://github.com/marius1975/Data_View

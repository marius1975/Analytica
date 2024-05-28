import { Layout, Menu } from 'antd';
import { FilterProvider } from './FilterContext';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import CreateSchemaForm from './CreateSchemaForm';
import React, { useState, useEffect } from 'react';
import MainPageCss from './MainPageCss.css';
const { Header, Content } = Layout;

const MainPage = ({ isLoggedIn, onLogin, onRegister }) => {
  const [formType, setFormType] = useState(null);
  const [selectedTab, setSelectedTab] = useState('home');

  const handleMenuClick = (type) => {
    setSelectedTab(type);
    setFormType(null); // Reset form type when switching tabs
  };

  const handleCloseForm = () => {
    setFormType(null);
  };


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', color: 'white', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0', marginRight: '2.5rem' }}>Data View</h1>
        <Menu theme="dark" mode="horizontal" selectedKeys={[selectedTab]} onClick={({ key }) => handleMenuClick(key)} style={{ border: 'none', flex: '1' }}>
          <Menu.Item key="home" style={{ fontSize: '1rem' }}>
            Home
          </Menu.Item>
          <Menu.Item key="about" style={{ fontSize: '1rem' }}>
            About Us
          </Menu.Item>
           <Menu.Item key="contact" style={{ fontSize: '1rem' }}>
                      Contact
                    </Menu.Item>
          {isLoggedIn ? (
            <Menu.Item key="dashboard" style={{ fontSize: '1rem' }}>
              Dashboard
            </Menu.Item>
          ) : null}
          {!isLoggedIn ? (
            <>
              <Menu.Item key="login" style={{ fontSize: '1rem' }}>
                Login
              </Menu.Item>
              <Menu.Item key="register" style={{ fontSize: '1rem' }}>
                Register
              </Menu.Item>
            </>
          ) : null}

        </Menu>
      </Header>

      <Content style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        {selectedTab === 'home' && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2>Welcome to Data View</h2>
            <p id="home_p1">Welcome to Data View, your one-stop solution for data management. Whether you are a business owner, researcher, or data enthusiast, Data View provides the tools you need to organize, analyze, and visualize your data.</p>
            <div className="data-visualization-container">
                          <div className="data-visualization"></div>
                           </div>
                            </div>
        )}
        {selectedTab === 'about' && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2>About Data View</h2>
            <p id = "about_p1">Data View is a data management application where you can register, create databases, and upload CSV and XLSX files. You can then view and manage your data through intuitive interfaces.</p>
            <p id = "about_p1">Data View is a comprehensive data management application designed to meet your diverse needs. With Data View, you can:</p>
                <ul style={{ textAlign: 'left' }}>
                  <li>Register an account to access personalized features and data storage.</li>
                  <li>Create databases to organize and store your data efficiently.</li>
                  <li>Upload CSV and XLSX files effortlessly, allowing seamless integration with your existing data.</li>
                  <li>Analyze your data using powerful tools and visualizations.</li>
                  <li>Collaborate with team members by sharing and editing data in real-time.</li>
                  <li>Customize your data views and reports to suit your preferences and requirements.</li>
                </ul>
                <p id = "about_p2">Experience the power of Data View today and take control of your data like never before!</p>
          </div>
        )}
        {selectedTab === 'contact' && (
                  <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h2>Contact Us</h2>
                    <p id="contact_p">
                      Address: Lalelelor 10, Timisoara, Romania<br />
                      Phone: +40 4567890<br />
                      Email: info@dataview.com
                    </p>
                  </div>
                )}
        {selectedTab === 'login' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <LoginForm onLogin={onLogin} onSwitchForm={() => handleMenuClick('register')} />
          </div>
        )}
        {selectedTab === 'register' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <RegistrationForm onLogin={() => handleMenuClick('login')} />
          </div>
        )}
        {isLoggedIn && selectedTab !== 'login' && selectedTab !== 'register' && (
          <CreateSchemaForm isLoggedIn={isLoggedIn} />
        )}
      </Content>
    </Layout>
  );

};

export default MainPage;



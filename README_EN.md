# Data View - README

## Project Description
This project is a data management and visualization application called "Data View." The application allows users to create accounts, log in, upload CSV and XLSX files, and manage data through an intuitive interface. The application provides features for organizing, analyzing, and visualizing data, making it useful for researchers, business owners, and data enthusiasts.

## Technologies Used
- Java
- Spark (web framework)
- React (frontend framework)
- Ant Design (UI library)

## GitLab Repository
The GitLab repository containing the complete source code is: [https://github.com/marius1975/Data_View]

## Project Deliverables
- **Complete Source Code**:
  - Available in the GitLab repository at: [https://github.com/marius1975/Data_View]

- **Project Documentation**:
  - Description of the application's architecture.
  - User manual.
  - UML diagrams for the application design.
  - Technical and functional specifications.

- **Configuration Files**:
  - `application.properties` file for backend configuration.
  - Configuration files for frontend and backend settings.

- **Installation and Usage Instructions**:
  - Detailed steps for compiling, installing, and launching the application.

- **Tests and Results**:
  - Unit and integration tests for the backend.
  - Functional tests for the frontend.
  - Testing reports and results.

## Application Compilation Steps

### Backend
1. **Clone the repository**:
    
    git clone https://github.com/marius1975/Data_View
    

2. **Navigate to the backend directory**:
    
    cd backend


3. **Compile the project using Maven**:
   
    mvn clean install
  

### Frontend
1. **Navigate to the frontend directory**:
  
    cd frontend
    

2. **Install dependencies**:
  
    npm install
  

3. **Compile the project**:
   
    npm run build
 

## Installation and Launch Steps

### Backend
1. Ensure the database is correctly configured. You need a MySQL database server where you create the `analytica_users` database.
2. Configure the `application.properties` file with the database access details.
3. Run the backend server:
  
    mvn spring-boot:run
  

### Frontend
1. After compiling the frontend project, launch the React application:
  
    npm start
   

## Using the Application
1. Access the application in your browser at `http://localhost:3000`.
2. Navigate between the available tabs (Home, About, Contact, Login, Register, Dashboard).
3. Register or log in to access the data management functionalities.
4. In the Dashboard tab, upload CSV or XLSX files and start visualizing and analyzing the data.

## File Structure

project-directory/
│
├── reactfrontend/
│ ├── public/
│ │ ├── index.html
│ │ └── ...
│ ├── src/
│ │ ├── App.js
│ │ ├── App.css
│ │ ├── CreateSchemaForm.js
│ │ ├── CreateSchemaForm.css
│ │ ├── LoginForm.js
│ │ ├── LoginForm.css
│ │ ├── MainPage.js
│ │ ├── MainPage.css
│ │ ├── RegistrationForm.js
│ │ ├── RegistrationForm.css
│ │ └── README.md
│ └── package.json
│
├── backend/
│ ├── src/
│ │ ├── main/
│ │ │ ├── java/
│ │ │ │ ├── backend/
│ │ │ │ │ ├── DataProcessor.java
│ │ │ │ │ ├── DB_Connection.java
│ │ │ │ │ ├── EncryptionUtils.java
│ │ │ │ │ ├── LoginData.java
│ │ │ │ │ ├── RegistrationData.java
│ │ │ │ ├── org/example/
│ │ │ │ │ └── Main.java
│ │ └── README.md
│ └── pom.xml
│
└── README.md

perl
Copiază codul

## Contributions
Contributions are welcome! Please open an issue or submit a pull request to discuss changes.

## Contact
For any questions or issues, please contact the development team at: [mj372012@gmail.com].

## Repository
The repository can be found at the following link: [https://github.com/marius1975/Data_View]

# Data View - README
## Descrierea proiectului
Acest proiect reprezintă o aplicație de gestionare și vizualizare a datelor, numită "Data View". Aplicația permite utilizatorilor să își creeze conturi, să se autentifice, să încarce fișiere CSV și XLSX și să gestioneze datele printr-o interfață intuitivă. Aplicația oferă funcționalități de organizare, analiză și vizualizare a datelor, fiind utilă pentru proprietari de afaceri și entuziaști ai datelor.

## Tehnologii utilizate
Java
Spark (framework web)
React (framework frontend)
Ant Design (bibliotecă UI)
## Repository GitHub
Adresa repository-ului GitHub cu întregul cod sursă este: https://github.com/marius1975/Data_View

## Livrabilele proiectului
**Codul sursă complet**:
Disponibil în repository-ul GitHub la adresa https://github.com/marius1975/Data_View

**Documentația proiectului**:
Descrierea arhitecturii aplicației.
Manualul de utilizare a aplicației.
Diagrame UML pentru designul aplicației.
Specificațiile tehnice și funcționale ale proiectului.

**Fișiere de configurare**:
Fișierul application.properties pentru configurarea backend-ului.
Fișierele de configurare pentru setările frontend-ului și backend-ului.
**Instrucțiuni de instalare și utilizare**:
Pașii detaliați pentru compilarea, instalarea și lansarea aplicației.

**Teste și rezultate**:
Testele unitare și de integrare pentru backend.
Testele funcționale pentru frontend.
Rapoarte de testare și rezultate.

## Pași de compilare a aplicației
### Backend
**Clonați repository-ul**:
git clone https://github.com/marius1975/Data_View

**Navigați în directorul backend**:
cd backend

**Compilați proiectul folosind Maven**:
mvn clean install

### Frontend
**Navigați în directorul frontend**:
cd frontend

**Instalați dependențele**:
npm install

**Compilați proiectul**:
npm run build

## Pași de instalare și lansare a aplicației
### Backend
Asigurați-vă că baza de date este configurată corect. Trebuie să aveți un server de baze de date MySQL în care să creați baza de date analytica_users.
Configurați fișierul application.properties cu datele de acces la baza de date.
Rulați serverul backend:
mvn spring-boot:run

### Frontend
După compilarea proiectului frontend, lansați aplicația React:
npm start

### Utilizarea aplicației
Accesați aplicația în browser la adresa http://localhost:3000.
Navigați între tab-urile disponibile (Home, About, Contact, Login, Register, Dashboard).
Înregistrați-vă sau autentificați-vă pentru a accesa funcționalitățile de gestionare a datelor.
În tab-ul Dashboard, încărcați fișiere CSV sau XLSX și începeți să vizualizați și să analizați datele.



### Structura fisierelor

project-directory/
│
├── reactfrontend/
│   ├── public/
│   │   ├── index.html
│   │   └── ...
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── CreateSchemaForm.js
│   │   ├── CreateSchemaForm.css
│   │   ├── LoginForm.js
│   │   ├── LoginForm.css
│   │   ├── MainPage.js
│   │   ├── MainPage.css
│   │   ├── RegistrationForm.js
│   │   ├── RegistrationForm.css
│   │   └── README.md
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   ├── backend/
│   │   │   │   │   ├── DataProcessor.java
│   │   │   │   │   ├── DB_Connection.java
│   │   │   │   │   ├── EncryptionUtils.java
│   │   │   │   │   ├── LoginData.java
│   │   │   │   │   ├── RegistrationData.java
│   │   │   │   ├── org/example/
│   │   │   │   │   └── Main.java
│   │   └── README.md
│   └── pom.xml
│
└── README.md



### Contributii:
Contribuțiile sunt binevenite! Deschideți un subiect sau trimiteți o cerere  pentru a discuta modificări.

### Contact
Pentru orice întrebări sau probleme, vă rugăm să contactați echipa de dezvoltare la adresa de email: mj372012@gmail.com.

### Repository
Repository-ul poate fi gasit la urmatorul link: https://github.com/marius1975/Data_View

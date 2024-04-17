
package org.example;
import backend.*;
import com.google.gson.Gson;
import com.google.gson.JsonIOException;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import org.apache.hadoop.shaded.com.google.gson.GsonBuilder;
import org.apache.spark.sql.*;
import spark.Request;
import spark.Response;
import spark.Session;
import spark.Spark;

//import javax.ws.rs.core.Request;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import javax.servlet.http.Part;
import static spark.Spark.*;
import javax.servlet.MultipartConfigElement;

public class Main {



    public static void main(String[] args){
        // ... (SparkSession and other setup code)
        SparkSession spark = SparkSession.builder()
                .appName("Analytica")
                .master("local[*]")
                .config("spark.driver.memory", "4g")
                .config("spark.executor.memory", "2g")

                .getOrCreate();



        port(8082);



        options("/*",
                (request, response) -> {

                    String accessControlRequestHeaders = request
                            .headers("Access-Control-Request-Headers");
                    if (accessControlRequestHeaders != null) {
                        response.header("Access-Control-Allow-Headers",
                                accessControlRequestHeaders);
                    }

                    String accessControlRequestMethod = request
                            .headers("Access-Control-Request-Method");
                    if (accessControlRequestMethod != null) {
                        response.header("Access-Control-Allow-Methods",
                                accessControlRequestMethod);
                    }

                    return "OK";
                });

        before((request, response) -> response.header("Access-Control-Allow-Origin", "*"));

        Spark.before((request, response) -> {
            String location = "uploads"; // Specify a temporary directory
            long maxFileSize = 100000000L; // Specify the maximum file size (in bytes)
            long maxRequestSize = 100000000L; // Specify the maximum request size (in bytes)

            MultipartConfigElement multipartConfig = new MultipartConfigElement(location, maxFileSize, maxRequestSize, 1024);

            request.raw().setAttribute("org.eclipse.jetty.multipartConfig", multipartConfig);
        });

        DB_Connection dbConnection = new DB_Connection(spark);
        AtomicReference<LoginData> loginData = new AtomicReference<>(new LoginData());
        DataProcessor dataProcessor = new DataProcessor(spark);

        // ... (Other routes and configurations)


        // Registration endpoint
        post("/api/register", (req, res) -> {
            try (Connection connection = dbConnection.createConnectionToDatabase()) {
                RegistrationData registrationData = new Gson().fromJson(req.body(), RegistrationData.class);

                // Generate a unique user ID (you can use UUID.randomUUID() or any other method)
                String userId = RegistrationData.generateUniqueUserId(connection);

                // Set the generated user ID in the session
                req.session().attribute("loggedInUserId", userId);

                String responseMessage = registrationData.registerUser(connection, req.session());
                return responseMessage;
            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500);
                return "Registration failed: " + e.getMessage();
            }
        });

        /*post("/api/login", (req, res) -> {
            try (Connection connection = dbConnection.createConnectionToDatabase()) {
                loginData.set(new Gson().fromJson(req.body(), LoginData.class));


                // Call the loginUser method to authenticate the user
                Session session = loginData.get().loginUser(connection, req.session());

                if (session != null) {

                    // Successful login, set the appropriate attribute in the session
                    if (session.attribute("loggedInUserId") != null) {

                        req.session().attribute("loggedInUserId", session.attribute("loggedInUserId"));
                    } else {
                        req.session().attribute("loggedInUsername", loginData.get().getUsername());
                    }

                    res.status(200); // OK
                    return "Login successful";
                } else {
                    // Invalid credentials
                    res.status(401); // Unauthorized
                    return "Invalid username or password";
                }
            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500); // Internal server error
                return "Login failed";
            }
        });
*/

        post("/api/login", (req, res) -> {
            try (Connection connection = dbConnection.createConnectionToDatabase()) {
                loginData.set(new Gson().fromJson(req.body(), LoginData.class));

                // Call the loginUser method to authenticate the user
                Session session = loginData.get().loginUser(connection, req.session());

                if (session != null) {
                    // Successful login, set the appropriate attribute in the session
                    if (session.attribute("loggedInUserId") != null) {
                        req.session().attribute("loggedInUserId", session.attribute("loggedInUserId"));
                        System.out.println("loggedInUserId attribute set to: " + session.attribute("loggedInUserId"));
                    } else {
                        req.session().attribute("loggedInUsername", loginData.get().getUsername());
                        System.out.println("loggedInUsername attribute set to: " + loginData.get().getUsername());
                    }

                    // Print the session ID and all attributes for verification
                    System.out.println("Session ID: " + session.id());
                    System.out.println("All session attributes: " + session.attributes());

                    res.status(200); // OK
                    return "Login successful";
                } else {
                    // Invalid credentials
                    res.status(401); // Unauthorized
                    return "Invalid username or password";
                }
            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500); // Internal server error
                return "Login failed";
            }
        });


        post("/api/create-database/:dbName", (request, response) -> {
            System.out.println("Inside create-database route");
            try (Connection connection = dbConnection.createConnectionToDatabase()) {

                String loggedInUserId = getUserId(request, loginData.get(), connection);
                String loggedInUsername = getUsername(request, loginData.get(), connection);
                // Check if the user is logged in
                if (loggedInUserId != null && loggedInUsername != null) {
                    String dbName = request.params(":dbName"); // Retrieve dbName from URL parameter
                    System.out.println("dbname: " + dbName);

                    String responseMessage = DataProcessor.createSchema(connection, loggedInUserId, loggedInUsername, dbName);
                    return responseMessage;
                } else {
                    response.status(401); // Unauthorized
                    return "Not logged in.";
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.status(500);
                return "Failed to create the database: " + e.getMessage();
            }
        });

        delete("/api/delete-database/:selectedDatabase", (request, response) -> {
            System.out.println("Inside delete-database route");
            try (Connection connection = dbConnection.createConnectionToDatabase()) {
                String loggedInUserId = getUserId(request, loginData.get(), connection);
                // Check if the user is logged in
                if (loggedInUserId != null) {
                    String dbNameToDelete = request.params(":selectedDatabase"); // Retrieve dbName from URL parameter
                    System.out.println("Database name to delete: " + dbNameToDelete);

                    // Implement the logic to delete the schema
                    String deleteSchemaSQL = "DROP SCHEMA IF EXISTS " + dbNameToDelete;
                    String deleteRecordSQL = "DELETE FROM analytica_users.user_databases WHERE database_name = ? AND user_id = ?";

                    try {
                        // Delete the schema
                        try (PreparedStatement deleteSchemaStatement = connection.prepareStatement(deleteSchemaSQL)) {
                            deleteSchemaStatement.execute();
                        }

                        // Delete the record from user_databases table
                        try (PreparedStatement deleteRecordStatement = connection.prepareStatement(deleteRecordSQL)) {
                            deleteRecordStatement.setString(1, dbNameToDelete);
                            deleteRecordStatement.setString(2, loggedInUserId);
                            deleteRecordStatement.executeUpdate();
                        }

                        return "Database deleted successfully";
                    } catch (SQLException e) {
                        e.printStackTrace();
                        response.status(500);
                        return "Failed to delete the database: " + e.getMessage();
                    }
                } else {
                    response.status(401); // Unauthorized
                    return "Not logged in.";
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.status(500);
                return "Failed to delete the database: " + e.getMessage();
            }
        });

// Get user's databases endpoint
        get("/api/user-databases", (req, res) -> {
            try (Connection connection = dbConnection.createConnectionToDatabase()) {
                //LoginData loginData = new Gson().fromJson(req.body(), LoginData.class);

                String loggedInUserId = getUserId(req, loginData.get(), connection);

                // Check if the user is logged in
                if (loggedInUserId != null) {
                    List<String> userDatabases = DataProcessor.getUserDatabases(connection, loggedInUserId);
                    return new Gson().toJson(userDatabases);
                } else {
                    res.status(401); // Unauthorized
                    return "Not logged in.";
                }
            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500);
                return "Failed to retrieve user databases: " + e.getMessage();
            }
        });



        post("/api/upload-file/:selectedDatabase", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String loggedInUserId = getUserId(req, loginData.get(), connection);
            String loggedInUsername = getUsername(req, loginData.get(), connection);
            String selectedDatabase = req.params(":selectedDatabase");

            if (loggedInUserId != null && loggedInUsername != null && req.raw().getPart("file") != null) {
                Part uploadedFile = req.raw().getPart("file");
                String fileName = Paths.get(uploadedFile.getSubmittedFileName()).getFileName().toString();
                String destinationPath = "uploads/" + fileName;

                try (InputStream is = uploadedFile.getInputStream()) {
                    Files.copy(is, Paths.get(destinationPath));
                } catch (IOException e) {
                    e.printStackTrace();
                    res.status(500);
                    return "Failed to upload the file.";
                }

                List<String> result = DataProcessor.insertFileIntoDatabase(selectedDatabase, destinationPath, loggedInUsername);

                if (result.isEmpty()) {
                    res.status(200);
                    return "Files successfully saved!";
                } else {

                    return result.get(0);
                }
            } else {
                res.status(400);
                return "No file uploaded.";
            }
        });


        get("/api/tables-in-database/:selectedDatabase", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();

            String loggedInUserId = getUserId(req, loginData.get(), connection);
            String selectedDatabase = req.params(":selectedDatabase");

            if (loggedInUserId != null) {
                List<String> tables = DataProcessor.getTablesInDatabase(connection, loggedInUserId, selectedDatabase);
                return new Gson().toJson(tables);
            } else {
                res.status(401); // Unauthorized
                return "Not logged in.";
            }
        });



        get("/api/get-table-data/:selectedDatabase/:tableName/:page/:pageSize", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");

            // Get page and pageSize from the request
            int page = Integer.parseInt(req.params(":page"));
            int pageSize = Integer.parseInt(req.params(":pageSize"));

            // Check if the user is logged in
            String loggedInUserId = getUserId(req, loginData.get(), connection);
            if (loggedInUserId != null) {
                // Get paginated table data
                List<Map<String, Object>> paginatedTableData = DataProcessor.getTableData(connection, selectedDatabase, tableName, page, pageSize);
                return new Gson().toJson(paginatedTableData);
            } else {
                res.status(401); // Unauthorized
                return "Not logged in.";
            }
        });

        get("/api/get-total-records/:selectedDatabase/:tableName", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");

            try {
                int totalRecords = DataProcessor.getTotalRecords(connection, selectedDatabase, tableName);
                return new Gson().toJson(new TotalRecordsResponse(totalRecords));
            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500); // Internal Server Error
                return "Failed to fetch total records: " + e.getMessage();
            }
        });

        post("/api/get-total-filtered-records/:selectedDatabase/:tableName", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");

            // Retrieve filters from the request body
            Map<String, Object> filters = new Gson().fromJson(req.body(), Map.class);

            try {
                int totalFilteredRecords = DataProcessor.getTotalFilteredRecords(connection, selectedDatabase, tableName, filters);
                return new Gson().toJson(new TotalFilteredRecordsResponse(totalFilteredRecords));

            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500); // Internal Server Error
                return "Failed to fetch total filtered records: " + e.getMessage();
            }
        });






        get("/api/get-distinct-column-values/:selectedDatabase/:tableName/:columnName", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");
            String columnName = req.params(":columnName");

            // Call the getDistinctColumnValues method and return the result
            List<String> distinctValues = DataProcessor.getDistinctColumnValues(connection, selectedDatabase, tableName, columnName);
            return new Gson().toJson(distinctValues);
        });



        post("/api/filter-table/:selectedDatabase/:tableName/:page/:pageSize", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");

            // Get page and pageSize from the request
            int page;
            int pageSize;
            try {
                page = Integer.parseInt(req.params(":page"));
                pageSize = Integer.parseInt(req.params(":pageSize"));
            } catch (NumberFormatException e) {
                // Handle the case where page or pageSize is missing or invalid
                res.status(400); // Bad Request
                return "Invalid page or pageSize parameter";
            }

            Map<String, String> filters = new Gson().fromJson(req.body(), Map.class);

            // Call the getFilteredTableData method and return the result
            List<Map<String, Object>> filteredData = DataProcessor.getFilteredTableData(connection, selectedDatabase, tableName, page, pageSize, filters);
            return new Gson().toJson(filteredData);
        });






        // Endpoint to get columns for a specific table
        get("/api/get-table-columns/:selectedDatabase/:tableName", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String databaseParam = req.params(":selectedDatabase");  // Rename the variable to avoid redeclaration
            String tableName = req.params(":tableName");

            // Call the method in DataProcessor to get table columns
            List<String> columns = DataProcessor.getTableColumns(connection, databaseParam, tableName);

            // Convert the list of columns to JSON and send it as a response
            return new Gson().toJson(columns);
        });

        post("/api/loginUser/:username/:password", (req, res) -> {
            // Retrieve username and password from route parameters
            String username = req.params(":username");
            String password = req.params(":password");

            Connection connection = null;
            try {
                // Create a connection to the database
                connection = dbConnection.createConnectionToDatabase();

                // Call getUserName method to retrieve the username
                String loggedInUsername = dataProcessor.getUserName(connection, username, password);

                if (loggedInUsername != null) {
                    // Login successful, return the username
                    return new Gson().toJson(loggedInUsername);
                } else {
                    // Login failed
                    res.status(401);
                    return "Login failed";
                }
            } catch (SQLException e) {
                e.printStackTrace();
                res.status(500);
                return "Internal server error";
            } finally {
                // Close the database connection
                if (connection != null) {
                    try {
                        connection.close();
                    } catch (SQLException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        delete("/api/delete-table/:selectedDatabase/:tableName", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String loggedInUserId = getUserId(req, loginData.get(), connection);
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");

            if (loggedInUserId != null) {
                boolean success = DataProcessor.deleteTable(connection, selectedDatabase, tableName);
                if (success) {
                    res.status(200);
                    return "Table deleted successfully.";
                } else {
                    res.status(500);
                    return "Failed to delete table.";
                }
            } else {
                res.status(401); // Unauthorized
                return "Not logged in.";
            }
        });

        post("/api/download-table-data/:selectedDatabase/:tableName/:page/:pageSize", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");

            // Get filters from the request body
            Map<String, String> filters = new Gson().fromJson(req.body(), Map.class);

            // Get page and pageSize from the request parameters
            int page = Integer.parseInt(req.params(":page"));
            int pageSize = Integer.parseInt(req.params(":pageSize"));
            String format = req.params(":format");
            // Call the backend method to generate and download the file
            InputStream fileStream = DataProcessor.generateTableDataFile(connection, selectedDatabase, tableName,format, filters, page, pageSize);

            // Set response headers
            setResponseHeaders(res, tableName);

            // Return the file stream
            return fileStream;
        });

       /* post("/api/logoff", (req, res) -> {
            Session session = req.session(false);

            if (session != null) {
                System.out.println(session);
                session.invalidate();
                res.status(200); // OK
                return "Logoff successful";
            } else {
                res.status(401); // Unauthorized
                return "Not logged in";
            }
        });
*/

        // Main.java

        post("/api/logoff", (req, res) -> {
            // Invalidate the session
            req.session().invalidate();
            res.status(200); // OK
            return "Logoff successful";
        });




       /* // Define the endpoint for calculating percentage difference
        post("/api/calculate-percentage/:selectedDatabase/:tableName/:columnName", (req, res) -> {
            Connection connection = dbConnection.createConnectionToDatabase();
            String selectedDatabase = req.params(":selectedDatabase");
            String tableName = req.params(":tableName");
            String columnName = req.params(":columnName");

            // Retrieve filters from the request body
            Map<String, Object> filters = new Gson().fromJson(req.body(), Map.class);

            try {
                // Call your calculation method here and return the result
                Map<String, Double> percentages = calculatePercentageDifference(connection, selectedDatabase, tableName, columnName, filters);
                return new Gson().toJson(percentages);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500); // Internal Server Error
                return "Failed to calculate percentage difference: " + e.getMessage();
            }
        });*/
        // ... (Other endpoints and configurations)


    }


    private static void setResponseHeaders(Response res, String fileName) {
        // Set content disposition to indicate attachment and specify the file name
        res.header("Content-Disposition", "attachment; filename=" + fileName + ".xlsx");
        // Set content type for XLSX files
        res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    private static String getUserId(Request request, LoginData loginData, Connection connection) {
        // Retrieve the user's ID from the session

        Session session = null;
        try {
            session = loginData.loginUser(connection, request.session());
            String loggedInUserId = session.attribute("loggedInUserId");
            System.out.println("loggedInUserId" + loggedInUserId);
            return loggedInUserId;
        } catch (Exception e) { // Catch the more general Exception
            throw new RuntimeException(e);
        }
    }






   private static String getUsername(Request request, LoginData loginData, Connection connection) {
        // Retrieve the user's ID from the session
        Session session = null;
        try {
            session = loginData.loginUser(connection, request.session());
            String loggedInUsername = session.attribute("loggedInUsername");
            System.out.println("loggedInUsername" + loggedInUsername);
            return loggedInUsername;
        } catch (Exception e) {
            // Catch the more general Exception
            throw new RuntimeException(e);
        }
    }





    private static class TotalRecordsResponse {
        private final int totalRecords;

        public TotalRecordsResponse(int totalRecords) {
            this.totalRecords = totalRecords;
        }

        public int getTotalRecords() {
            return totalRecords;
        }
    }

    private static class TotalFilteredRecordsResponse {
        private int totalFilteredRecords;

        public TotalFilteredRecordsResponse(int totalFilteredRecords) {
            this.totalFilteredRecords = totalFilteredRecords;
        }

        // Getter and setter for totalFilteredRecords (if needed)
        public int getTotalFilteredRecords() {
            return totalFilteredRecords;
        }

        public void setTotalFilteredRecords(int totalFilteredRecords) {
            this.totalFilteredRecords = totalFilteredRecords;
        }
    }



}






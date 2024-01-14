package backend;

import java.io.*;
import java.sql.*;
import java.util.*;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.spark.sql.*;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructField;
import org.apache.spark.sql.types.StructType;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Connection;
import java.util.List;

import static backend.DB_Connection.loadPasswordFromConfigFile;

public class DataProcessor {

    private static SparkSession spark;

    public DataProcessor(SparkSession spark) {
        this.spark = spark;
    }

   /* public static String createSchema(Connection connection, String userId, String dbName) throws SQLException {
        System.out.println("Schema name: " + dbName);

        // Implement the logic to create a new schema for the user
        String createSchemaSQL = "CREATE SCHEMA IF NOT EXISTS " + dbName;
        String insertSchemaRecordSQL = "INSERT INTO analytica_users.user_databases (user_id, database_name) VALUES (?, ?)";

        try {
            // Create the new schema
            try (PreparedStatement createSchemaStatement = connection.prepareStatement(createSchemaSQL)) {
                createSchemaStatement.execute();
            }

            // Insert a record into the user_databases table
            try (PreparedStatement insertSchemaRecordStatement = connection.prepareStatement(insertSchemaRecordSQL)) {
                insertSchemaRecordStatement.setString(1, userId);
                insertSchemaRecordStatement.setString(2, dbName);
                insertSchemaRecordStatement.executeUpdate();
            }

            return "Schema created successfully";
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }
*/

    public static String createSchema(Connection connection, String userId,String userName, String dbName) throws SQLException {
        System.out.println("Schema name: " + dbName);

        // Implement the logic to create a new schema for the user
        String createSchemaSQL = "CREATE SCHEMA IF NOT EXISTS " + dbName;
        String insertSchemaRecordSQL = "INSERT INTO analytica_users.user_databases (user_id, username, database_name) VALUES (?, ? , ?)";

        try {
            // Create the new schema
            try (PreparedStatement createSchemaStatement = connection.prepareStatement(createSchemaSQL)) {
                createSchemaStatement.execute();
            }

            // Insert a record into the user_databases table
            try (PreparedStatement insertSchemaRecordStatement = connection.prepareStatement(insertSchemaRecordSQL)) {
                insertSchemaRecordStatement.setString(1, userId);
                insertSchemaRecordStatement.setString(2, userName);
                insertSchemaRecordStatement.setString(3, dbName);
                insertSchemaRecordStatement.executeUpdate();
            }

            return dbName;
        } catch (SQLIntegrityConstraintViolationException duplicateError) {
            return "Schema already exists for this user";
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }



    public static List<String> getUserDatabases(Connection connection, String userId) throws SQLException {
        // Implement the logic to retrieve user's databases
        List<String> databases = new ArrayList<>();
        String sql = "SELECT database_name FROM analytica_users.user_databases WHERE user_id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            ResultSet resultSet = statement.executeQuery();

            while (resultSet.next()) {
                String databaseName = resultSet.getString("database_name");
                databases.add(databaseName);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }

        return databases;
    }





    public static List<String> insertFileIntoDatabase(String selectedDatabase, String uploadedFilePath, String loggedInUsername) {
        File uploadedFileObj = new File(uploadedFilePath);

        if (!uploadedFileObj.exists()) {
            return Collections.singletonList("File does not exist.");
        }

        Dataset<Row> df;

        if (uploadedFilePath.endsWith(".csv")) {
            df = spark.read()
                    .option("header", "true")
                    .csv(uploadedFilePath);
        } else if (uploadedFilePath.endsWith(".xlsx")) {
            try (FileInputStream excelFile = new FileInputStream(uploadedFilePath)) {
                //IOUtils.setByteArrayMaxOverride(500000000);
                Workbook workbook = new XSSFWorkbook(excelFile);
                Sheet sheet = workbook.getSheetAt(0);

                List<String> columnNames = new ArrayList<>();

                org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(0);
                for (Cell cell : headerRow) {
                    String columnName;
                    if (cell.getCellType() == CellType.STRING) {
                        columnName = cell.getStringCellValue();
                    } else if (cell.getCellType() == CellType.NUMERIC) {
                        columnName = String.valueOf(cell.getNumericCellValue());
                    } else {
                        columnName = "";
                    }
                    columnNames.add(columnName);
                }

                List<Map<String, String>> data = new ArrayList<>();
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    org.apache.poi.ss.usermodel.Row dataRow = sheet.getRow(i);
                    Map<String, String> rowData = new HashMap<>();
                    for (int j = 0; j < columnNames.size(); j++) {
                        Cell cell = dataRow.getCell(j);
                        String columnName = columnNames.get(j);
                        String cellValue;
                        if (cell.getCellType() == CellType.STRING) {
                            cellValue = cell.getStringCellValue();
                        } else if (cell.getCellType() == CellType.NUMERIC) {
                            cellValue = String.valueOf(cell.getNumericCellValue());
                        } else {
                            cellValue = "";
                        }
                        rowData.put(columnName, cellValue);
                    }
                    data.add(rowData);
                }

                List<org.apache.spark.sql.Row> rows = new ArrayList<>();
                for (Map<String, String> rowData : data) {
                    List<String> values = new ArrayList<>();
                    for (String columnName : columnNames) {
                        values.add(rowData.get(columnName));
                    }
                    rows.add(RowFactory.create((Object[]) values.toArray()));
                }

                StructType schema = new StructType(columnNames.stream()
                        .map(columnName -> DataTypes.createStructField(columnName, DataTypes.StringType, true))
                        .toArray(StructField[]::new));

                df = spark.createDataFrame(rows, schema);

                //workbook.close();
            } catch (IOException e) {
                e.printStackTrace();
                return Collections.singletonList("Error reading Excel file.");
            }/*finally {
                IOUtils.setByteArrayMaxOverride(100000000); // Reset to the default value
            }*/
        } else {
            System.out.println("Unsupported file format.");
            return Collections.singletonList("Unsupported file format.");
        }

        // Create a new column "user_id" with the value of loggedInUserId
        df = df.withColumn("username", functions.lit(loggedInUsername).cast(DataTypes.StringType)); // Cast it to string

        String jdbcUrl = "jdbc:mysql://localhost:3306/" + selectedDatabase;
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("user", "root");
        connectionProperties.setProperty("password", "Parolamea_1@"); //loadPasswordFromConfigFile()

        try {
            String tableName = "table_" + uploadedFileObj.getName().toLowerCase().replaceAll("[^a-zA-Z0-9]+", "_");
            df.printSchema();
            df.write()
                    .mode(SaveMode.Append)
                    .jdbc(jdbcUrl, tableName, connectionProperties);

            System.out.println("Table created, and data inserted successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.singletonList("Error inserting data into the database.");
        }

        List<String> uploadedData = df.toJSON().collectAsList();
        return uploadedData;
    }

    public static List<String> getTablesInDatabase(Connection connection, String loggedInUserId, String selectedDatabase) {
        List<String> tables = new ArrayList<>();

        try {
            // You may need to adjust the SQL query depending on your database system
            String query = "SHOW TABLES IN " + selectedDatabase; // For MySQL
            // String query = "SELECT table_name FROM information_schema.tables WHERE table_schema = ?"; // For PostgreSQL

            PreparedStatement statement = connection.prepareStatement(query);
            // If you are using PostgreSQL, you need to set the schema name as a parameter:
            // statement.setString(1, selectedDatabase);

            ResultSet resultSet = statement.executeQuery();

            while (resultSet.next()) {
                String tableName = resultSet.getString(1);
                tables.add(tableName);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return tables;
    }

    public static List<Map<String, Object>> getTableData(Connection connection, String selectedDatabase, String tableName, int pageNumber, int pageSize) {
        List<Map<String, Object>> tableData = new ArrayList<>();

        try {
            // Adjust the SQL query to match your database system
            String query = "SELECT * FROM " + selectedDatabase + "." + tableName + " LIMIT ? OFFSET ?"; // For MySQL
            // String query = "SELECT * FROM " + selectedDatabase + "." + tableName + " LIMIT ? OFFSET ?"; // For PostgreSQL

            int offset = (pageNumber - 1) * pageSize;

            PreparedStatement statement = connection.prepareStatement(query);
            statement.setInt(1, pageSize);
            statement.setInt(2, offset);

            ResultSet resultSet = statement.executeQuery();

            ResultSetMetaData metaData = resultSet.getMetaData();
            int columnCount = metaData.getColumnCount();

            while (resultSet.next()) {
                Map<String, Object> rowData = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object columnValue = resultSet.getObject(i);
                    rowData.put(columnName, columnValue);
                }
                tableData.add(rowData);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return tableData;
    }


    public static int getTotalRecords(Connection connection,String selectedDatabase, String tableName) throws SQLException {
        int totalRecords = 0;
        String query = "SELECT COUNT(*) FROM " + selectedDatabase + "." + tableName;
        PreparedStatement statement = connection.prepareStatement(query);

        ResultSet resultSet = statement.executeQuery();

            if (resultSet.next()) {
                totalRecords = resultSet.getInt(1);
            }


            return totalRecords;

    }
    /*public static int getTotalFilteredRecords(Connection connection, String selectedDatabase, String tableName, Map<String, String> filters) throws SQLException {
        int totalFilteredRecords = 0;

        // Build the WHERE clause based on filters
        StringBuilder whereClause = new StringBuilder();
        List<String> filterValues = new ArrayList<>();

        if (filters != null && !filters.isEmpty()) {
            whereClause.append(" WHERE ");
            for (Map.Entry<String, String> entry : filters.entrySet()) {
                whereClause.append(tableName).append(".").append(entry.getKey());
                whereClause.append(" = ? AND ");
                filterValues.add(entry.getValue());
            }
            // Remove the trailing " AND "
            whereClause.setLength(whereClause.length() - 4); // Adjusted from -5 to -4
        }

        System.out.println("filter values:" + filterValues);

        // Build the SQL query
        String query = "SELECT COUNT(*) FROM " + selectedDatabase + "." + tableName + whereClause.toString();
        PreparedStatement statement = connection.prepareStatement(query);

        // Set filter values
        int parameterIndex = 1;
        for (String filterValue : filterValues) {
            statement.setString(parameterIndex++, filterValue);
        }

        try (ResultSet resultSet = statement.executeQuery()) {
            if (resultSet.next()) {
                totalFilteredRecords = resultSet.getInt(1);
                System.out.println("total filtered records: " + totalFilteredRecords);
            }
        }

        return totalFilteredRecords;
    }
*/
    public static int getTotalFilteredRecords(Connection connection, String selectedDatabase, String tableName, Map<String, String> filters) throws SQLException {
        int totalFilteredRecords = 0;

        // Build the WHERE clause based on filters
        StringBuilder whereClause = new StringBuilder();
        List<String> filterValues = new ArrayList<>();

        if (filters != null && !filters.isEmpty()) {
            whereClause.append(" WHERE ");
            for (Map.Entry<String, String> entry : filters.entrySet()) {
                whereClause.append(tableName).append(".").append(entry.getKey());
                whereClause.append(" = ? AND ");
                filterValues.add(entry.getValue());
            }
            // Remove the trailing " AND "
            whereClause.setLength(whereClause.length() - 4);
        }

        System.out.println("filter values:" + filterValues);

        // Build the SQL query
        String query = "SELECT COUNT(*) FROM " + selectedDatabase + "." + tableName + whereClause.toString();
        PreparedStatement statement = connection.prepareStatement(query);

        // Set filter values
        int parameterIndex = 1;
        for (String filterValue : filterValues) {
            statement.setString(parameterIndex++, filterValue);
        }

        try (ResultSet resultSet = statement.executeQuery()) {
            if (resultSet.next()) {
                totalFilteredRecords = resultSet.getInt(1);
                System.out.println("total filtered records: " + totalFilteredRecords);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return totalFilteredRecords;
    }


    /*public static List<Map<String, Object>> getFilteredTableData(Connection connection, String selectedDatabase, String tableName,int page, int pageSize,
             Map<String, String> filters) {


        // Retrieve foreign key information
        Map<String, String> foreignKeys = getForeignKeyInformation(connection, selectedDatabase, tableName);

        // Build the SQL query with JOIN clauses based on foreign keys and filters
        String query = buildFilteredQuery(selectedDatabase, tableName, filters, foreignKeys, page, pageSize);

        // Execute the query and return the filtered data
        return executeFilteredQuery(connection,selectedDatabase,query);
        // added pageNumber, pageSize
    }
*/

    public static List<Map<String, Object>> getFilteredTableData(Connection connection, String selectedDatabase, String tableName, int page, int pageSize, Map<String, String> filters) {
        // Retrieve foreign key information
        Map<String, String> foreignKeys = getForeignKeyInformation(connection, selectedDatabase, tableName);

        // Build the SQL query with JOIN clauses based on foreign keys and filters
        String query = buildFilteredQuery(selectedDatabase, tableName, filters, foreignKeys, page, pageSize);

        // Debugging
        System.out.println("Generated SQL Query: " + query);

        // Execute the query and return the filtered data
        List<Map<String, Object>> result = executeFilteredQuery(connection, selectedDatabase, query);

        // Debugging
        System.out.println("Result Size: " + result.size());

        return result;
    }

    // Method to retrieve foreign key information for a table
    private static Map<String, String> getForeignKeyInformation(Connection connection, String selectedDatabase, String tableName) {
        Map<String, String> foreignKeys = new HashMap<>();

        try {
            // Adjust the SQL query based on your database system to get foreign key information
            String query = "SELECT COLUMN_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
                    "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL";

            PreparedStatement statement = connection.prepareStatement(query);
            statement.setString(1, selectedDatabase);
            statement.setString(2, tableName);

            ResultSet resultSet = statement.executeQuery();

            while (resultSet.next()) {
                String columnName = resultSet.getString("COLUMN_NAME");
                String referencedTableName = resultSet.getString("REFERENCED_TABLE_NAME");
                foreignKeys.put(columnName, referencedTableName);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return foreignKeys;
    }

    /*private static String buildFilteredQuery(String selectedDatabase, String tableName, Map<String, String> filters, Map<String, String> foreignKeys, int page, int pageSize) {
        StringBuilder queryBuilder = new StringBuilder("SELECT * FROM ");
        queryBuilder.append(selectedDatabase).append(".").append(tableName);

        // Add JOIN clauses based on foreign keys
        for (Map.Entry<String, String> entry : foreignKeys.entrySet()) {
            queryBuilder.append(" INNER JOIN ").append(selectedDatabase).append(".").append(entry.getValue());
            queryBuilder.append(" ON ").append(tableName).append(".").append(entry.getKey());
            queryBuilder.append(" = ").append(entry.getValue()).append(".").append(entry.getKey());
        }

        // Add WHERE clause based on filters
        if (filters != null && !filters.isEmpty()) {
            queryBuilder.append(" WHERE ");
            for (Map.Entry<String, String> entry : filters.entrySet()) {
                queryBuilder.append(tableName).append(".").append(entry.getKey());
                queryBuilder.append(" = '").append(entry.getValue()).append("' AND ");
            }
            // Remove the trailing " AND "
            queryBuilder.setLength(queryBuilder.length() - 5);
        }

        // Add pagination conditions to the SQL query only if there are no JOINs or WHERE conditions
        if (foreignKeys.isEmpty() && (filters == null || filters.isEmpty())) {
            queryBuilder.append(" LIMIT ").append(pageSize).append(" OFFSET ").append((page - 1) * pageSize);
        }

        return queryBuilder.toString();
    }



    private static List<Map<String, Object>> executeFilteredQuery(Connection connection, String selectedDatabase, String query) {
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            if (selectedDatabase == null) {
                throw new SQLException("Database name is null");
            }

            // Execute the query and populate the result list
            try (PreparedStatement statement = connection.prepareStatement(query)) {
                ResultSet resultSet = statement.executeQuery();
                ResultSetMetaData metaData = resultSet.getMetaData();
                int columnCount = metaData.getColumnCount();

                while (resultSet.next()) {
                    Map<String, Object> rowData = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        String columnName = metaData.getColumnName(i);
                        Object columnValue = resultSet.getObject(i);
                        rowData.put(columnName, columnValue);
                    }
                    result.add(rowData);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return result;
    }

*/

    private static String buildFilteredQuery(String selectedDatabase, String tableName, Map<String, String> filters, Map<String, String> foreignKeys, int page, int pageSize) {
        StringBuilder queryBuilder = new StringBuilder("SELECT * FROM ");
        queryBuilder.append(selectedDatabase).append(".").append(tableName);

        // Add JOIN clauses based on foreign keys
        for (Map.Entry<String, String> entry : foreignKeys.entrySet()) {
            queryBuilder.append(" INNER JOIN ").append(selectedDatabase).append(".").append(entry.getValue());
            queryBuilder.append(" ON ").append(tableName).append(".").append(entry.getKey());
            queryBuilder.append(" = ").append(entry.getValue()).append(".").append(entry.getKey());
        }

        // Add WHERE clause based on filters
        if (filters != null && !filters.isEmpty()) {
            queryBuilder.append(" WHERE ");
            for (Map.Entry<String, String> entry : filters.entrySet()) {
                queryBuilder.append(tableName).append(".").append(entry.getKey());
                queryBuilder.append(" = '").append(entry.getValue()).append("' AND ");
            }
            // Remove the trailing " AND "
            queryBuilder.setLength(queryBuilder.length() - 5);
        }

        // Add pagination conditions to the SQL query
        queryBuilder.append(" LIMIT ").append(pageSize).append(" OFFSET ").append((page - 1) * pageSize);

        return queryBuilder.toString();
    }

    private static List<Map<String, Object>> executeFilteredQuery(Connection connection, String selectedDatabase, String query) {
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            if (selectedDatabase == null) {
                throw new SQLException("Database name is null");
            }

            // Execute the query and populate the result list
            try (PreparedStatement statement = connection.prepareStatement(query)) {
                ResultSet resultSet = statement.executeQuery();
                ResultSetMetaData metaData = resultSet.getMetaData();
                int columnCount = metaData.getColumnCount();

                while (resultSet.next()) {
                    Map<String, Object> rowData = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        String columnName = metaData.getColumnName(i);
                        Object columnValue = resultSet.getObject(i);
                        rowData.put(columnName, columnValue);
                    }
                    result.add(rowData);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return result;
    }

    // Method to get distinct values for a column in a table
    public static List<String> getDistinctColumnValues(Connection connection, String selectedDatabase, String tableName, String columnName) {
        List<String> distinctValues = new ArrayList<>();

        try {
            // Add logging to check parameter values
            System.out.println("Selected Database: " + selectedDatabase);
            System.out.println("Table Name: " + tableName);
            System.out.println("Column Name: " + columnName);

            // Check if columnName is not empty or undefined
            if (columnName == null || columnName.trim().isEmpty()) {
                System.out.println("Column Name is empty or undefined.");
                return distinctValues;
            }

            String query = "SELECT DISTINCT " + columnName + " FROM " + selectedDatabase + "." + tableName;
            System.out.println("SQL Query: " + query);

            try (PreparedStatement statement = connection.prepareStatement(query)) {
                ResultSet resultSet = statement.executeQuery();

                while (resultSet.next()) {
                    String value = resultSet.getString(1);
                    System.out.println("Distinct value: " + value);

                    if (value != null && !value.trim().isEmpty()) {
                        distinctValues.add(value);
                    }
                }

            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return distinctValues;
    }


    // Method to get columns for a specific table
    public static List<String> getTableColumns(Connection connection, String selectedDatabase, String tableName) {
        List<String> columns = new ArrayList<>();

        try {
            String query = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?";
            try (PreparedStatement statement = connection.prepareStatement(query)) {
                statement.setString(1, selectedDatabase);
                statement.setString(2, tableName);

                try (ResultSet resultSet = statement.executeQuery()) {
                    while (resultSet.next()) {
                        String columnName = resultSet.getString("COLUMN_NAME");
                        if (columnName != null && !columnName.trim().isEmpty()) {
                            columns.add(columnName);
                            System.out.println("Column Name: " + columnName);
                        }
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            System.err.println("Error fetching table columns: " + e.getMessage());
        }

        return columns;
    }



}



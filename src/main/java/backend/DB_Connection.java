package backend;

import org.apache.spark.sql.SparkSession;

import java.io.FileInputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DB_Connection {

    private SparkSession spark;

    public DB_Connection(SparkSession spark) {
        this.spark = spark;
    }
    public static Connection createConnectionToDatabase() throws SQLException {
        String jdbcUrl = "jdbc:mysql://localhost:3306/";//analytica_users
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("user", "root");
        connectionProperties.setProperty("password", "Parolamea_1@"); //loadPasswordFromConfigFile()
        return DriverManager.getConnection(jdbcUrl, connectionProperties);
    }
    public static String loadPasswordFromConfigFile() {
        Properties config = new Properties();
        String password = "";

        try {
            FileInputStream input = new FileInputStream("C:/Users/Marius/Desktop/config.properties");
            config.load(input);
            password = config.getProperty("db.password");
        } catch (IOException e) {
            e.printStackTrace();
        }

        return password;
    }



}

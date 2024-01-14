
package backend;

import spark.Session;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class RegistrationData {
    private String username;
    private String email;
    private String password;
    private String userId;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public static String generateUniqueUserId(Connection connection) throws SQLException {
        String userId = UUID.randomUUID().toString();
        String sql = "SELECT COUNT(*) FROM analytica_users.users WHERE user_id = ?";

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            ResultSet resultSet = statement.executeQuery();

            if (resultSet.next()) {
                int count = resultSet.getInt(1);
                if (count == 0) {
                    return userId;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }

        return null;
    }

    public String registerUser(Connection connection, Session session) throws SQLException {
        String generatedUserId = generateUniqueUserId(connection);

        if (generatedUserId != null) {
            session.attribute("loggedInUserId", generatedUserId);

            String sql = "INSERT INTO analytica_users.users (user_id, username, email, password) VALUES (?, ?, ?, ?)";

            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, generatedUserId); //getUserId
                statement.setString(2, getUsername());
                statement.setString(3, getEmail());
                statement.setString(4, getPassword());
                statement.executeUpdate();
                return "Registration successful";
            } catch (SQLException e) {
                e.printStackTrace();
                throw e;
            }
        } else {
            return "Registration failed: Could not generate a unique user ID.";
        }
    }
}

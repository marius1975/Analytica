package backend;
import spark.Session;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class LoginData {
    private String username;
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    //process the login operation
    public Session loginUser(Connection connection, Session session) throws SQLException {
        String sql = "SELECT user_id, username FROM analytica_users.users WHERE username = ? AND password = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, getUsername());
            statement.setString(2, getPassword());
            ResultSet resultSet = statement.executeQuery();
            if (resultSet.next()) {
                String loggedInUserId = resultSet.getString("user_id");
                String loggedInUsername = resultSet.getString("username");

                // Store the loggedInUserId in the session
                session.attribute("loggedInUserId", loggedInUserId);
                session.attribute("loggedInUsername",loggedInUsername);
                // Log that the attribute is set
                System.out.println("Session attribute loggedInUserId set to: " + loggedInUserId);
                System.out.println("Session attribute loggedInUsername set to: " + loggedInUsername);

                // Return the updated session
                return session;
            }
            return null;
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }


}

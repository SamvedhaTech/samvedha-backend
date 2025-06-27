const dotenv = require("dotenv");
const app = require("./app");
const databaseConnection = require("./config/databaseConnection");

dotenv.config({ path: './config/.env' });

databaseConnection();

app.listen(process.env.PORT, () => {
    console.log("Server is running on port", process.env.PORT);
});

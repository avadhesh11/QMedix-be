process.env.TZ = 'Asia/Kolkata';
import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

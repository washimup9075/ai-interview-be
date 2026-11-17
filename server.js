import 'dotenv/config';
import app from './src/app.js';
import connectToDB from './src/db/db.js';

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is required to start the backend.');
    process.exit(1);
  }

  const isConnected = await connectToDB();

  if (!isConnected) {
    console.error('Unable to start server because MongoDB connection failed.');
    process.exit(1);
  }

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
};

startServer();
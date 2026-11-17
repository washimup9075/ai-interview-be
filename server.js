import 'dotenv/config';
import app from './src/app.js';
import connectToDB from './src/db/db.js';

const startServer = async () => {
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
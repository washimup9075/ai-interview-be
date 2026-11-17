import express from 'express';
import cors from 'cors'
import authRoutes from './routes/auth.route.js'
import interviewRoutes from './routes/interview.route.js'
import questionRoutes from './routes/question.route.js'
import resumeRoutes from './routes/resume.route.js'
import jdRoutes from './routes/jd.route.js'
import coachRoutes from './routes/coach.route.js'
import paymentRoutes from './routes/payment.route.js'
import cookieParser from 'cookie-parser';


const app=express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) or matching origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use('/api/auth',authRoutes)
app.use('/api/interview',interviewRoutes);
app.use('/api/questions',questionRoutes)
app.use('/api/resume',resumeRoutes)
app.use('/api/jd',jdRoutes)
app.use('/api/coach',coachRoutes)
app.use('/api/payment',paymentRoutes)



export default app;
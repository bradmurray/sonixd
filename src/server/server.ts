import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import 'express-async-errors';
import { errorHandler } from './middleware';
import { routes } from './routes';

require('./lib/passport');

const PORT = 9321;

const app = express();
app.set('trust proxy', 1);
const staticPath = path.join(__dirname, '../sonixd-client/');

app.use(express.static(staticPath));
app.use(
  cors({
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    origin: [`http://localhost:4343`, `${process.env.APP_BASE_URL}`],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    name: 'user_session',
    resave: true,
    rolling: true,
    saveUninitialized: false,
    secret: process.env.DATABASE_SECRET || 'secret',
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 10 * 60 * 1000,
      dbRecordIdFunction: undefined,
      // 10 minutes
      dbRecordIdIsSessionId: true,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.use(routes);
app.use(errorHandler);

app.listen(9321, () => console.log(`Listening on port ${PORT}`));

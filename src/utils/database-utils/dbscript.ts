import { Client } from 'pg';
import { ConfigService } from '@nestjs/config';
import { initSql } from './init';

async function createDatabaseIfNotExists(configService: ConfigService) {
  console.log('Starting createDatabaseIfNotExists function');

  const client = new Client({
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    user: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: 'postgres',
  });

  await client.connect();
  console.log('Connected to PostgreSQL');

  const dbName = configService.get('DB_NAME');
  const res = await client.query(
    `SELECT 1 FROM pg_database WHERE datname='${dbName}'`,
  );

  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created successfully`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }

  await client.end();
  console.log('Disconnected from PostgreSQL');

  const dbClient = new Client({
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    user: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: dbName,
  });

  await dbClient.connect();
  console.log(`Connected to ${dbName} database`);
  await dbClient.query(initSql);
  console.log('SQL script executed successfully');

  await dbClient.end();
  console.log('Disconnected from database');

  await dbClient.end();
}

export default createDatabaseIfNotExists;

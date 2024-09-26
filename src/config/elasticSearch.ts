import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'fY8dMveqTtHuToK4znTD',
  },
  tls: {
    rejectUnauthorized: false,
  },
  
  sniffOnStart: false, 
  sniffOnConnectionFault: false, 
});

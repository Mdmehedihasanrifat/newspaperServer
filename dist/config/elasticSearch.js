"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
exports.esClient = new elasticsearch_1.Client({
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

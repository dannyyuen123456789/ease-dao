// import {
//     Db
// } from 'mongodb';
import config from '../../config/system';
var MongoClient = require('mongodb').MongoClient;
var userName = config.databaseUsername;
var pwd = config.databasePassword;
var url = config.databaseURL;
var databaseName = config.databaseName;

export default async () => {
    var DB_URL = `mongodb://${userName}:${pwd}@${url}/${databaseName}`;
    console.log("Mongo Db loading ----",DB_URL);
    const connection = await MongoClient.connect(DB_URL, {
        ssl:true,
        sslValidate: false,
        useNewUrlParser: true,
        sslCA:fs.readFileSync("D:\\amazon\\rds-combined-ca-bundle.pem"),
        useUnifiedTopology: true
    });
    console.log("Mongo Db loaded!");
    return connection.connection.db;
};
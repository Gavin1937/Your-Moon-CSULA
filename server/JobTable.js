const uuid = require("uuid");
const redis = require('redis');
const { getUnixTimestampNow } = require('./utils.js');


/**
 * Converting standard uuid string into byte string that can be accept by Redis
 * 
 * e.g. "\x01\x02\x03\x04"
 * 
 * @param {String} uuid_str 
 * @returns {String} byte string
 */
function uuid_to_byte_str(uuid_str) {
    let tmp = [...uuid.parse(uuid_str)]; // parse uuid_str to byte array, and then copy it
    return tmp.map((i)=>{return '\\x'+i.toString(16);}).join('');
}

class JobTable {
    
    /**
     * @param {Object} table_config 
     * @param {winston.Logger} logger 
     */
    constructor(table_config, logger) {
        this.logger = logger;
        this.client = null;
        this.table_config = table_config;
        this.default_expire = 600; // 10 min
        if ('expire' in this.table_config && Number.isInteger(this.table_config.expire)) {
            this.default_expire = this.table_config.expire;
        }
        this.table_type = 'native';
        let valid_redis = (
            this.table_config.type == 'redis' &&
            'host' in this.table_config &&
            this.table_config.host.length > 0 &&
            'port' in this.table_config &&
            Number.isInteger(this.table_config.port)
        );
        if (valid_redis) {
            this.table_type = 'redis';
        }
    }
    
    /**
     * Initialize JobTable, you should run this function right after constructor
     */
    async init() {
        if (this.table_type == 'redis') {
            try {
                this.client = redis.createClient({
                    socket: {
                        host: this.table_config.host,
                        port: this.table_config.port
                    },
                    username: ('username' in this.table_config) ? this.table_config.username : null,
                    password: ('password' in this.table_config) ? this.table_config.password : null
                });
                
                this.client.on('connect', function() {
                    this.logger.info('Initialize JobTable as Redis Table');
                }.bind(this));
                
                this.client.on('error', function(error) {
                    throw new Error(`Failed to establish Redis connection: ${error}`);
                }.bind(this));
                
                this.client.connect();
            } catch (error) {
                this.logger.error(`Redis Error: ${error}`);
                this.logger.error('Cannot connect to Redis, fallback to Native Object Table');
                this.table_type = 'native';
            }
        }
        
        if (this.table_type == 'native') {
            this.logger.info('Initialize JobTable as Native Object Table');
            this.table_type = 'native';
            this.client = {};
        }
    }
    
    is_redis_table() {return this.table_type == 'redis';}
    
    is_native_table() {return this.table_type == 'native';}
    
    /**
     * Set a string value to JobTable
     * @param {String} str_val string value
     * @param {int} expire when does this value expire, default to `this.default_expire`
     * @returns {uuid.UUID} uuid key
     */
    async push(str_val, expire=this.default_expire) {
        let key = uuid.v4();
        this.logger.debug(`uuid key: ${key}`);
        if (this.is_redis_table()) {
            return new Promise((resolve, reject) => {
                let key_byte = uuid_to_byte_str(key);
                this.client.set(key_byte, str_val, {
                    NX: true,
                    EX: expire,
                }).then((response)=>{
                    let key_expire = getUnixTimestampNow()+expire;
                    if (response != 0 && response != null) {resolve(key, key_expire);}
                    else {reject('Duplicate key in JobTable:Redis');}
                }).catch((_)=>{
                    reject('Failed to push value into JobTable:Redis');
                });
            });
        }
        else if (this.is_native_table()) {
            return new Promise((resolve, reject) => {
                if (key in this.client) {reject('Duplicate key in JobTable:Native')}
                let key_expire = getUnixTimestampNow()+expire;
                this.client[key] = {value:str_val, expire:key_expire};
                resolve(key, key_expire);
            });
        }
    }
    
    /**
     * Get `uuid_key` value from JobTable
     * @param {uuid.UUID} uuid_key uuid key
     * @returns {String} value of the input key
     */
    async get(uuid_key) {
        if (this.is_redis_table()) {
            return new Promise((resolve, reject) => {
                let key = uuid_to_byte_str(uuid_key);
                this.client.get(key).then((value)=>{
                    this.logger.debug(`table value: ${JSON.stringify(value, null, 2)}`);
                    if (value === null || value === undefined) {
                        reject('Failed to retrieve key from JobTable:Redis')
                    } else {
                        resolve(value);
                    }
                }).catch((_)=>{reject('Failed to retrieve key from JobTable:Redis');});
            });
        }
        else if (this.is_native_table()) {
            return new Promise((resolve, reject) => {
                if (uuid_key in this.client && getUnixTimestampNow() < this.client[uuid_key].expire) {
                    let value = this.client[uuid_key].value;
                    this.logger.debug(`table value: ${JSON.stringify(value, null, 2)}`);
                    resolve(value);
                } else {
                    delete this.client[uuid_key];
                    reject('Failed to retrieve key from JobTable:Native');
                }
            });
        }
    }
    
    /**
     * Get `uuid_key` value from JobTable, and then delete it
     * @param {uuid.UUID} uuid_key uuid key
     * @returns {String} value of the input key
     */
    async pop(uuid_key) {
        if (this.is_redis_table()) {
            return new Promise((resolve, reject) => {
                let key = uuid_to_byte_str(uuid_key);
                this.client.get(key).then((value)=>{
                    this.logger.debug(`table value: ${JSON.stringify(value, null, 2)}`);
                    if (value === null || value === undefined) {
                        reject('Failed to retrieve key from JobTable:Redis')
                    }
                    this.client.del(key).then((response)=>{
                        if (response != 0) {resolve(value);}
                        else {reject('Failed to delete key from JobTable:Redis')}
                    }).catch((_)=>{reject('Failed to delete key from JobTable:Redis');});
                }).catch((_)=>{reject('Failed to retrieve key from JobTable:Redis');});
            });
        }
        else if (this.is_native_table()) {
            return new Promise((resolve, reject) => {
                if (uuid_key in this.client && getUnixTimestampNow() < this.client[uuid_key].expire) {
                    let value = this.client[uuid_key].value;
                    this.logger.debug(`table value: ${JSON.stringify(value, null, 2)}`);
                    delete this.client[uuid_key];
                    resolve(value);
                } else {
                    delete this.client[uuid_key];
                    reject('Failed to retrieve key from JobTable:Native');
                }
            });
        }
    }
    
}

module.exports = JobTable;
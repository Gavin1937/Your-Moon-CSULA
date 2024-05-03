const mysql = require("mysql2");
const JobTable = require('./JobTable.js');
const uuid = require("uuid");
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");


class DBManager {
    
    constructor(db_config, aes_key, jwt_secret, table_config, logger) {
        this.establishedConnection = null;
        this.db = null;
        this.db_config = db_config;
        this.aes_key = aes_key;
        this.jwt_secret = jwt_secret;
        this.logger = logger;
        this.table = new JobTable(table_config, logger);
        this.connect();
    }
    
    destructor() {
        console.log("destructor");
        this.dropConnection();
    }
    
    connection() {
        return new Promise((resolve, reject) => {
            resolve(mysql.createConnection(this.db_config))
        });
    }
    
    dropConnection() {
        if (this.establishedConnection) {
        this.establishedConnection.then(res => {
            res.end();
            this.logger.info(res.state, 'Connection dropped from database');
        });
        
        this.db = null;
        this.establishedConnection = null;
        }
    }
    
    connect() {
        if (!this.establishedConnection) {
            let that = this;
            this.establishedConnection = this.connection().then(res => {
                res.connect(function(err) {
                    that.logger.debug(`res.connect err: ${err}`);
                    if (err) {
                        that.logger.error(`Exception when connecting to database:\n${err.stack}`);
                        that.db = null;
                        that.establishedConnection = null;
                        that.dropConnection();
                        return;
                    }
                    else {
                        that.logger.info(`Connected to database`);
                        that.db = res;
                    }
                })
            });
            this.table.init().catch((error)=>{
                that.establishedConnection = false;
                that.logger.warn(`Unable to initialize JobTable: ${error}`);
            })
        }
    }
    
    addImage(instrument, image, moon, handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database or JobTable`);
            handler(new Error(`Did not connect to database or JobTable`), null);
            return;
        }
        
        this.logger.debug(`instrument: ${JSON.stringify(instrument, null, 2)}`);
        this.logger.debug(`image: ${JSON.stringify(image, null, 2)}`);
        this.logger.debug(`moon: ${JSON.stringify(moon, null, 2)}`);
        let insert_inst =
        "INSERT IGNORE INTO Instruments(inst_type, inst_make, inst_model) VALUES(?,?,?);";
        this.logger.debug(`insert_inst: ${insert_inst}`);
        try {
            this.db.query(
                insert_inst,
                [instrument.inst_type, instrument.inst_make, instrument.inst_model],
                (error, result) => {
                    this.logger.debug(`result: ${JSON.stringify(result,null,2)}`);
                    this.logger.debug(`error: ${JSON.stringify(error,null,2)}`);
                    if (error) {
                        handler(new Error("Failed to insert new instrument"), null);
                        return;
                    } else {
                        this.logger.debug(`No error while insert ignore into Instrument table.`);
                        let insert_img = null;
                        let insert_param = [];
                        // trigger ignore
                        if (result.affectedRows == 0 && result.insertId == 0) {
                            insert_img = `
                            INSERT INTO Images(
                                inst_id, img_name, img_type, img_uri,
                                img_altitude, img_longitude, img_latitude, img_timestamp,
                                moon_detect_flag, moon_exist_flag,
                                moon_loc_x, moon_loc_y, moon_loc_r
                            )
                            VALUES(
                                (
                                    SELECT inst_id FROM Instruments
                                    WHERE
                                    inst_type = ? AND
                                    inst_make = ? AND
                                    inst_model = ?
                                ),
                                ?,?,?,?,?,?,?,?,?,?,?,?
                            );
                            `;
                            insert_param = [
                                instrument.inst_type, instrument.inst_make, instrument.inst_model,
                                image.img_name, image.img_type, image.img_uri,
                                image.img_altitude, image.img_longitude, image.img_latitude, image.img_timestamp,
                                moon.moon_detect_flag, moon.moon_exist_flag,
                                moon.moon_loc_x, moon.moon_loc_y, moon.moon_loc_r
                            ];
                        }
                        else {
                            insert_img = `
                            INSERT INTO Images(
                                inst_id, img_name, img_type, img_uri,
                                img_altitude, img_longitude, img_latitude, img_timestamp,
                                moon_detect_flag, moon_exist_flag,
                                moon_loc_x, moon_loc_y, moon_loc_r
                            )
                            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?);
                            `;
                            insert_param = [
                                result.insertId,
                                image.img_name, image.img_type, image.img_uri,
                                image.img_altitude, image.img_longitude, image.img_latitude, Math.floor(image.img_timestamp/1000),
                                moon.moon_detect_flag, moon.moon_exist_flag,
                                moon.moon_loc_x, moon.moon_loc_y, moon.moon_loc_r
                            ];
                        }
                        this.db.query(insert_img, insert_param, (error2, result2) => {
                            this.logger.debug(`result2: ${JSON.stringify(result2,null,2)}`);
                            this.logger.debug(`error2: ${JSON.stringify(error2,null,2)}`);
                            if (error2) {
                                handler(new Error("Failed to insert new image"));
                                return;
                            } else {
                                handler(null, { message: "New image inserted", img_id: result2.insertId, });
                            }
                        });
                    }
                }
            );
        } catch (query_error) {
            this.logger.error(`query_error: ${query_error.stack}`);
            this.dropConnection();
        }
    }
    
    // if submitted user_email does't exists, create a new user
    // otherwise, just return jwt & log exiting user in
    // input parameter "user_email" is a decrypted email in plain text
    registerOrLoginUser(user_email, handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database or JobTable`);
            handler(new Error(`Did not connect to database or JobTable`), null);
            return;
        }
        
        let insert_user = `INSERT INTO Users(user_email, user_email_md5) VALUES(?,?);`;
        let encrypted_email = CryptoJS.AES.encrypt(
            user_email,
            CryptoJS.enc.Base64.parse(this.aes_key),
            {
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
                iv: CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
            }
        );
        let hashed_email = CryptoJS.MD5(encrypted_email.toString()).toString();
        let insert_user_list = [encrypted_email.toString(), hashed_email]
        
        this.logger.debug(`encrypted_email: ${encrypted_email}`);
        this.logger.debug(`hashed_email: ${hashed_email}`);
        
        this.db.query(insert_user, insert_user_list, (error, result) => {
            this.logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            this.logger.debug(`error: ${JSON.stringify(error,null,2)}`);
            // failed to insert, duplicate user_email
            if (error) {
                let select_user = `SELECT user_id FROM Users WHERE user_email_md5 = ?;`;
                let select_user_list = [hashed_email]
                this.db.query(select_user, select_user_list, (error2, result2) => {
                    this.logger.debug(`result2: ${JSON.stringify(result2,null,2)}`);
                    this.logger.debug(`error2: ${JSON.stringify(error2,null,2)}`);
                    if (error2 || result2.length != 1) {
                        handler(new Error("Failed to find user_id or user_email not matching"), null);
                        return;
                    }
                    
                    // found user, generate jwt with user_id & hashed_email
                    this.logger.info(`Login existing user, user_id=${result2[0].user_id}`);
                    let jwt_output = jwt.sign(
                        {
                            user_id:result2[0].user_id,
                            user_type: 'regular',
                            hashed_email:hashed_email
                        },
                        Buffer.from(this.jwt_secret, 'base64'),
                        {algorithm:"HS256", expiresIn:"2 days"}
                    );
                    this.logger.debug(`jwt_output: ${jwt_output}`);
                    handler(null, jwt_output)
                    return;
                });
            }
            // insert success, generate jwt with user_id & hashed_email
            else {
                this.logger.info(`Create new user, user_id=${result.insertId}`);
                let jwt_output = jwt.sign(
                    {
                        user_id:result.insertId,
                        user_type: 'regular',
                        hashed_email:hashed_email
                    },
                    Buffer.from(this.jwt_secret, 'base64'),
                    {algorithm:"HS256", expiresIn:"2 days"}
                );
                this.logger.debug(`jwt_output: ${jwt_output}`);
                handler(null, jwt_output)
                return;
            }
        })
    }
    
    registerGuest(handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database or JobTable`);
            handler(new Error(`Did not connect to database or JobTable`), null);
            return;
        }
        
        let session_uuid = uuid.v4();
        let jwt_output = jwt.sign(
            {
                user_id:'sess-'+session_uuid,
                user_type: 'guest'
            },
            Buffer.from(this.jwt_secret, 'base64'),
            {algorithm:"HS256", expiresIn:"1 hours"}
        );
        this.logger.debug(`jwt_output: ${jwt_output}`);
        handler(null, jwt_output)
        return;
    }
    
    verifyUserJWT(user_jwt, handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database or JobTable`);
            handler(new Error(`Did not connect to database or JobTable`), null);
            return;
        }
        
        jwt.verify(user_jwt, Buffer.from(this.jwt_secret, 'base64'), (jwt_error, payload) => {
            this.logger.debug(`jwt_error: ${jwt_error}`);
            this.logger.debug(`payload: ${JSON.stringify(payload,null,2)}`);
            if (jwt_error) {
                handler(new Error("Invalid JWT"), null);
                return;
            } else {
                // guest user session
                if (
                    typeof payload.user_id === 'string' &&
                    payload.user_id.startsWith('sess-') &&
                    payload.user_type === 'guest'
                ) {
                    this.logger.debug(`guest user: ${payload.user_id}`);
                    handler(null, {ok:true, ...payload});
                    return;
                }
                // regular user
                else if (
                    typeof payload.user_id === 'number' &&
                    payload.user_type === 'regular'
                ) {
                    let get_email = `SELECT user_email FROM Users WHERE user_id = ? AND user_email_md5 = ?;`;
                    let get_email_list = [payload.user_id, payload.hashed_email];
                    this.db.query(get_email, get_email_list, (error, result) => {
                        this.logger.debug(`error: ${JSON.stringify(error,null,2)}`);
                        this.logger.debug(`result: ${JSON.stringify(result,null,2)}`);
                        if (error || result.length < 1) {
                            handler(new Error("Failed to find user's email by id"), null);
                            return;
                        } else {
                            let encrypted_email = result[0].user_email;
                            this.logger.debug(`encrypted_email: ${encrypted_email.toString(CryptoJS.enc.Utf8)}`);
                            let hashed_email = CryptoJS.MD5(encrypted_email).toString();
                            this.logger.debug(`hashed_email: ${hashed_email}`);
                            if (hashed_email != payload.hashed_email) {
                                handler(new Error("User email not matching"), null);
                                return;
                            } else {
                                handler(null, {ok:true, ...payload});
                            }
                        }
                    });
                }
            }
        });
    }
    
    registerUploadJob(upload_job_expire, user_id, handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database or JobTable`);
            handler(new Error(`Did not connect to database or JobTable`), null);
            return;
        }
        
        try {
            this.table.push(user_id.toString(), upload_job_expire).then((upload_uuid, expire)=>{
                handler(null, {upload_uuid:upload_uuid, expires:expire});
            }).catch((error)=>{
                this.logger.error(`Unable to push to JobTable: ${error}`);
                handler(new Error(`Unable to push to JobTable: ${error}`), null);
            });
        } catch (query_error) {
            this.logger.error(`query_error: ${query_error.stack}`);
            this.dropConnection();
        }
    }
    
    finishUploadJob(is_guest_user, upload_uuid, upload_count, flag_count, handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database or JobTable`);
            handler(new Error(`Did not connect to database or JobTable`), null);
            return;
        }
        
        if (!is_guest_user) { // regular user
            try {
                let update_user = `UPDATE Users SET user_upload_count = user_upload_count + ?, user_flag_count = user_flag_count + ? WHERE user_id = ?;`;
                
                this.table.pop(upload_uuid).then((user_id)=>{
                    this.logger.debug(`user_id: ${JSON.stringify(user_id, null, 2)}`);
                    this.db.query(update_user, [upload_count, flag_count, user_id], handler);
                }).catch((error)=>{
                    this.logger.error(`error: ${error}`);
                    handler(new Error(error), null);
                })
            } catch (query_error) {
                this.logger.error(`query_error: ${query_error.stack}`);
                this.dropConnection();
            }
        } else {
            handler(null, null);
        }
    }
    
}

module.exports = DBManager;
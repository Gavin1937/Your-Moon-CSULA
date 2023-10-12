const mysql = require("mysql2");

class DBManager {
    
    constructor(db_config, logger) {
        this.establishedConnection = null;
        this.db = null;
        this.db_config = db_config;
        this.logger = logger;
        this.connect();
    }
    
    destructor() {
        console.log("destructor");
        this.dropConnection();
    }
    
    connection() {
        return new Promise((resolve, reject) => {
            resolve(mysql.createConnection(this.db_config))
        })
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
                        that.logger.info(`Connected to database, res.state=${res.state}`);
                        that.db = res;
                    }
                })
            });
        }
    }
    
    addImage(instrument, image, moon, handler)
    {
        if (this.establishedConnection == null || this.db == null) {
            this.logger.error(`Did not connect to database`);
            handler(new Error(`Did not connect to database`), null);
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
                    if (error) {
                        handler(error, null);
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
                                image.img_altitude, image.img_longitude, image.img_latitude, image.img_timestamp,
                                moon.moon_detect_flag, moon.moon_exist_flag,
                                moon.moon_loc_x, moon.moon_loc_y, moon.moon_loc_r
                            ];
                        }
                        this.db.query(insert_img, insert_param, handler);
                    }
                }
            );
        } catch (query_error) {
            this.logger.error(`query_error: ${query_error.stack}`);
            this.dropConnection();
        }
    }
    
}

module.exports = DBManager;
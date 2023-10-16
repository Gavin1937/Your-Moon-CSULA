
CREATE DATABASE IF NOT EXISTS YourMoonDB;

USE YourMoonDB;

CREATE TABLE IF NOT EXISTS Users(
    user_id             INT              AUTO_INCREMENT PRIMARY KEY NOT NULL,
    user_email          VARCHAR(256)     NOT NULL, -- encrypted email
    user_email_md5      VARCHAR(32)      NOT NULL, -- encrypted email md5
    user_upload_count   INT              DEFAULT 0,
    user_flag_count     INT              DEFAULT 0,
    CONSTRAINT unique_inst UNIQUE (user_email,user_email_md5)
);

CREATE TABLE IF NOT EXISTS Instruments(
    inst_id             INT              AUTO_INCREMENT PRIMARY KEY NOT NULL,
    inst_type           VARCHAR(25)      NOT NULL, -- "phone", "camera", "phone+telescope", "camera+telescope"
    inst_make           VARCHAR(256)     NULL,
    inst_model          VARCHAR(256)     NULL,
    CONSTRAINT unique_inst UNIQUE (inst_type,inst_make,inst_model)
    -- other instrument metadata...
);

CREATE TABLE IF NOT EXISTS Images(
    img_id              INT              AUTO_INCREMENT PRIMARY KEY NOT NULL,
    inst_id             INT              NOT NULL,
    metadata_id         INT              DEFAULT -1, -- reserved id
    FOREIGN KEY (inst_id) REFERENCES Instruments(inst_id),
    
    -- image metadata
    img_name            VARCHAR(50)      NOT NULL,
    img_type            VARCHAR(50)      NOT NULL, -- MIME type
    img_uri             VARCHAR(256)     NOT NULL,
    img_altitude        FLOAT            NOT NULL, -- unit meter
    img_longitude       FLOAT            NOT NULL,
    img_latitude        FLOAT            NOT NULL,
    img_timestamp       INT              NOT NULL, -- unix timestamp of image taken time
    
    -- moon metadata
    moon_detect_flag    INT              NULL,     -- reserved flag
    moon_exist_flag     BOOL             NULL,     -- flag, img contains moon
    moon_loc_x          INT              NULL,     -- circle center x
    moon_loc_y          INT              NULL,     -- circle center y
    moon_loc_r          INT              NULL      -- circle radius
);

CREATE TABLE IF NOT EXISTS UploadJobs(
    uuid                BINARY(16)       PRIMARY KEY NOT NULL,
    expires             INT              NOT NULL,
    user_id             INT              NOT NULL
);

CREATE TABLE IF NOT EXISTS RegistrationJobs(
    uuid                BINARY(16)       PRIMARY KEY NOT NULL,
    expires             INT              NOT NULL,
    aes_key             VARCHAR(128)     NOT NULL
);

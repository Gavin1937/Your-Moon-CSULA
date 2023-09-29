
CREATE TABLE IF NOT EXISTS LunarImageDB(
    id                  INT              AUTO_INCREMENT PRIMARY KEY,

    -- user data
    user_token          VARCHAR(256)     NOT NULL, -- OAuth 2.0 token/credential
    user_email          VARCHAR(256)     NOT NULL,

    -- image metadata
    img_name            VARCHAR(50)      NOT NULL,
    img_type            VARCHAR(50)      NOT NULL, -- MIME type
    img_uri             VARCHAR(256)     NOT NULL,
    img_altitude        FLOAT            NOT NULL,
    img_longitude       FLOAT            NOT NULL,
    img_latitude        FLOAT            NOT NULL,
    img_timestamp       INT              NOT NULL, -- unix timestamp of image taken time

    -- moon metadata
    moon_detect_flag    INT              NULL, -- reserved flag
    moon_exist_flag     BOOL             NULL, -- flag, img contains moon
    moon_loc_x          INT              NULL, -- circle center x
    moon_loc_y          INT              NULL, -- circle center y
    moon_loc_r          INT              NULL, -- circle radius

    -- instrument metadata
    instrument_type     VARCHAR(25)     NOT NULL, -- "phone", "camera", "phone+telescope", "camera+telescope"
    instrument_make     VARCHAR(256)    NULL,
    instrument_model    VARCHAR(256)    NULL,

);

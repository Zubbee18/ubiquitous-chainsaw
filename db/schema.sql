    
    /* Field                  Type               Notes
    id                     UUID v7            Primary key
    name                   VARCHAR + UNIQUE   Person's full name
    gender                 VARCHAR            "male" or "female"
    gender_probability     FLOAT              Confidence score
    age                    INT                Exact age
    age_group              VARCHAR            child, teenager, adult, senior
    country_id             VARCHAR(2)         ISO code (NG, BJ, etc.)
    country_name           VARCHAR            Full country name
    country_probability    FLOAT              Confidence score
    created_at             TIMESTAMP          Auto-generated*/
# ################################################## #
#                                                    #
# Simple python3 utility to help you to create a     #
# REGULAR user account in the system without the     #
# backend                                            #
#                                                    #
# ################################################## #

import traceback
from datetime import datetime, timedelta
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from base64 import b64encode, b64decode
from hashlib import md5
import jwt

BLOCK_SIZE = 16
IV = b'\x00' * 16


def base_encrypt(data:bytes, key:bytes):
    'Base encryption, taking bytes data + bytes key & returning bytes'
    if not isinstance(data, bytes) or not isinstance(key, bytes):
        raise ValueError("data and key MUST be bytes.")
    
    cipher = AES.new(key, AES.MODE_CBC, iv=IV)
    output = cipher.encrypt(pad(data, BLOCK_SIZE, style='pkcs7'))
    return output

def encrypt_utf8(utf8_data:str, b64_key:str, output_as_b64:bool=False):
    'Utf8 encryption, taking utf8 data + base64 key & returning bytes or base64 str'
    output = base_encrypt(utf8_data.encode('utf-8'), b64decode(b64_key))
    if output_as_b64:
        return b64encode(output).decode('utf-8')
    return output


def main():
    
    print('This utility will help you to create a regular user account in the system without the backend.\n')
    
    aes_key = input('1) What is the "aes_key" in the backend config:\n')
    jwt_secret = b64decode(input('\n2) What is the "jwt_secret" in the backend config:\n'))
    
    user_email = input('\n3) What is the "user_email":\n')
    user_email = encrypt_utf8(user_email, aes_key, output_as_b64=True)
    user_email_md5 = md5(user_email.encode('utf-8')).hexdigest()
    insert_sql = f'INSERT INTO YourMoonDB.Users(user_email, user_email_md5) VALUES("{user_email}", "{user_email_md5}");'
    select_sql = f'SELECT user_id FROM YourMoonDB.Users WHERE user_email_md5 = "{user_email_md5}";'
    
    print(f'\n4) Now, you can connect to the database and enter following sql:\n\n{insert_sql}\n{select_sql}\n')
    user_id = int(input('5) What is the user_id you get? '))
    
    
    output_jwt = jwt.encode(
        {
            "user_id":user_id, "hashed_email":user_email_md5,
            "exp": (datetime.now()+timedelta(days=2)).timestamp(),
        },
        jwt_secret,
        algorithm="HS256"
    )
    output_js = f'document.cookie = "token={output_jwt}";'
    print(f'\n* Here is your JWT token for the frontend:\n\n{output_jwt}\n')
    print(f'* Here is how you can set JWT token with JavaScript:\n\n{output_js}\n')


if __name__ == '__main__':
    try:
        main()
    except Exception as err:
        print(err)
        print(traceback.format_exc())
        print()
        exit(-1)

# ################################################## #
#                                                    #
# Simple python3 encryption/decryption utility for   #
# all the CryptoJS encrypt/decrypt operations in     #
# this project. You can use functions inside         #
# this module to help you to encode/decode messages  #
# between client and server                          #
#                                                    #
# ################################################## #

from base64 import b64decode, b64encode
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

__all__ = [
    'BLOCK_SIZE', 'IV',
    'base_encrypt', 'base_decrypt',
    'encrypt_utf8', 'decrypt_utf8',
    'encrypt_b64', 'decrypt_b64',
]

BLOCK_SIZE = 16
IV = b'\x00' * 16

def base_encrypt(data:bytes, key:bytes):
    'Base encryption, taking bytes data + bytes key & returning bytes'
    if not isinstance(data, bytes) or not isinstance(key, bytes):
        raise ValueError("data and key MUST be bytes.")
    
    cipher = AES.new(key, AES.MODE_CBC, iv=IV)
    output = cipher.encrypt(pad(data, BLOCK_SIZE, style='pkcs7'))
    return output

def base_decrypt(data:bytes, key:bytes):
    'Base decryption, taking bytes data + bytes key & returning bytes'
    if not isinstance(data, bytes) or not isinstance(key, bytes):
        raise ValueError("data and key MUST be bytes.")
    
    cipher = AES.new(key, AES.MODE_CBC, iv=IV)
    output = unpad(cipher.decrypt(data), BLOCK_SIZE, style='pkcs7')
    return output

def encrypt_utf8(utf8_data:str, b64_key:str, output_as_b64:bool=False):
    'Utf8 encryption, taking utf8 data + base64 key & returning bytes or base64 str'
    output = base_encrypt(utf8_data.encode('utf-8'), b64decode(b64_key))
    if output_as_b64:
        return b64encode(output).decode('utf-8')
    return output

def decrypt_utf8(utf8_data:str, b64_key:str, output_as_b64:bool=False):
    'Utf8 decryption, taking utf8 data + base64 key & returning bytes or base64 str'
    output = base_decrypt(utf8_data.encode('utf-8'), b64decode(b64_key))
    if output_as_b64:
        return b64encode(output).decode('utf-8')
    return output

def encrypt_b64(b64_data:str, b64_key:str, output_as_b64:bool=False):
    'Base64 encryption, taking base64 data + base64 key & returning bytes or base64 str'
    output = base_encrypt(b64decode(b64_data), b64decode(b64_key))
    if output_as_b64:
        return b64encode(output).decode('utf-8')
    return output

def decrypt_b64(b64_data:str, b64_key:str, output_as_b64:bool=False):
    'Base64 decryption, taking base64 data + base64 key & returning bytes or base64 str'
    output = base_decrypt(b64decode(b64_data), b64decode(b64_key))
    if output_as_b64:
        return b64encode(output).decode('utf-8')
    return output


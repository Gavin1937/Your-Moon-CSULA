# this file is for deploying inside docker container only

from moondetect_server import create_app
from pathlib import Path

if __name__ == '__main__':
    DATA_PATH = Path('/app/data')
    if DATA_PATH.exists() == False:
        raise ValueError(f'Cannot find data path: {DATA_PATH}')
    APP = create_app(DATA_PATH=DATA_PATH)
    APP.run()

from flask import Flask, Request, Response, request
from flask_cors import CORS, cross_origin
import json
from copy import deepcopy
from moondetect import detect_moon, circle_to_square, circle_to_rectangle
from typing import Union
from pathlib import Path
from sys import argv
import traceback


def create_app(**kwargs):
    APP = Flask(__name__, static_folder="static", static_url_path="")
    cors = CORS(APP)
    # 30 MB max content length
    APP.config["MAX_CONTENT_LENGTH"] = 30 * 1024**2
    APP.config['CORS_HEADERS'] = 'Content-Type'
    
    for k,v in kwargs.items():
        APP.config[k] = v
    
    # json utilities
    RESPONSE_TEMPLATE = {
        "ok": False,
        "payload": None,
        "status": -1
    }
    
    # utilities
    def objToJsonResp(data:Union[str,dict,list], ok=True, status=200) -> Response:
        output = deepcopy(RESPONSE_TEMPLATE)
        output.update({"ok":ok, "payload":data, "status":status})
        return Response(json.dumps(output, ensure_ascii=False), status=status, content_type="application/json")
    
    def strToErrResp(data:str, status=400) -> Response:
        output = deepcopy(RESPONSE_TEMPLATE)
        output.pop("payload")
        output.update({"ok":False, "error":data, "status":status})
        return Response(json.dumps(output, ensure_ascii=False), status=status, content_type="application/json")
    
    
    # api
    @APP.route("/detectMoon", methods=["GET"])
    @cross_origin()
    def detectMoon():
        """
        Find Moon from filename
        
        Param:
        ==========
            * filename [url query]
                * string filename to search in DATA_PATH
            * type     [url query]
                * OPTIONAL, string, type of return.
                * Can be one of following: "circle", "square", "rectangle"
                * Default: "circle"
        
        Return:
        ==========
            json return:
            .. code-block:: json
            {
                "ok": bool,
                "payload": { ... },
                "status": int
            }
            
            * when mode == "circle"
            {
                "payload": {
                    "type": "circle",
                    "x": int,
                    "y": int,
                    "radius": int
                }
            }
            
            * when mode == "square"
            {
                "payload": {
                    "type": "square",
                    "x": int,
                    "y": int,
                    "width": int
                }
            }
            
            * when mode == "rectangle"
            {
                "payload": {
                    "type": "rectangle",
                    "x1": int,
                    "y1": int,
                    "x2": int,
                    "y2": int
                }
            }
        """
        
        try:
            args = request.args
            DATA_PATH = APP.config.get("DATA_PATH")
            if DATA_PATH is not None:
                DATA_PATH = Path(DATA_PATH)
            else:
                raise ValueError('Cannot find data_path.')
            
            data_table = dict()
            for file in DATA_PATH.iterdir():
                if file.is_file():
                    data_table[file.name] = file
            
            _filename = args.get("filename")
            if _filename is None or _filename not in data_table:
                raise ValueError('No filename or cannot find file in data_path.')
            _filename = data_table[_filename]
            
            _type = args.get("type")
            if _type is None:
                _type = 'circle'
            if _type not in ['circle', 'square', 'rectangle']:
                raise ValueError('Invalid return type.')
            
            moon_loc = detect_moon(_filename)
            
            ret = None
            if _type == 'circle':
                ret = { "type":_type, "x": int(moon_loc[0]), "y": int(moon_loc[1]), "radius": int(moon_loc[2]) }
            elif _type == 'square':
                moon_loc = circle_to_square(*moon_loc)
                ret = { "type":_type, "x": int(moon_loc[0]), "y": int(moon_loc[1]), "width": int(moon_loc[2]) }
            elif _type == 'rectangle':
                moon_loc = circle_to_rectangle(*moon_loc)
                ret = { "type":_type, "x1": int(moon_loc[0]), "y1": int(moon_loc[1]), "x2": int(moon_loc[2]), "y2": int(moon_loc[3]) }
            
        except Exception as err:
            print(f'Exception: {str(err)}')
            print(f'Traceback: {traceback.format_exc()}')
            return strToErrResp(str(err))
        
        return objToJsonResp(ret)
    
    
    return APP


if __name__ == '__main__':
    if len(argv) < 2:
        raise ValueError('No Enough arguments')
    
    DATA_PATH = Path(argv[1])
    if DATA_PATH.exists() == False:
        raise ValueError(f'Cannot find data path: {DATA_PATH}')
    
    APP = create_app(DATA_PATH=DATA_PATH)
    APP.run(host='0.0.0.0', port='3002')

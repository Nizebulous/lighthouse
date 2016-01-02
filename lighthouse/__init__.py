from flask import Flask
from lighthouse import lh
from docker_api import docker_bp


app = Flask(__name__)
app.config['DOCKER_BOOT2DOCKER'] = True
app.register_blueprint(lh)
app.register_blueprint(docker_bp)

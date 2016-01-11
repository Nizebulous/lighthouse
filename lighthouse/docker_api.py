import os
from pytz import utc
from datetime import datetime
from ConfigParser import ConfigParser
from docker.utils import kwargs_from_env

from docker import Client

from werkzeug.local import LocalProxy
from flask import Blueprint, current_app, jsonify


docker_bp = Blueprint('docker_api', __name__, url_prefix='/api/docker/')


def get_docker_client():
    if current_app.config.get('DOCKER_BOOT2DOCKER', False):
        # TODO(Dom): for some reason when using Boot2Docker we run into issues with hostname
        # validation. This requires more exploration, but we disable it for now
        return Client(**kwargs_from_env(assert_hostname=False))
    else:
        return Client(
            base_url=current_app.config.get('DOCKER_HOST', 'unix://var/run/docker.sock')
        )


docker = LocalProxy(get_docker_client)


def get_docker_configs():
    config_path = os.path.expanduser(current_app.config.get('DOCKER_CONFIG_DIR', 'config'))
    files = [(f, os.path.join(config_path, f)) for f in os.listdir(config_path) if os.path.isfile(os.path.join(config_path, f))]
    config_map = {}
    for filename, path in files:
        config = ConfigParser()
        config.read(f)
        config_map[os.path.splitext(filename)] = config
    return config_map

config_map = LocalProxy(get_docker_configs)


class Field(object):

    ORDER = 0

    def __init__(self, source=None, label=None):
        self.source = source
        self.label = label
        self.order = Field.ORDER
        Field.ORDER += 1

    def bind(self, field_name):
        """
        bind this field to the Mapping object containing it
        """
        self.field_name = field_name
        self.source = self.source or field_name
        self.label = self.label or field_name.upper()

    def map(self, value):
        return value


class DateTimeField(Field):
    DAYS = 86400
    HOURS = 3600
    MINUTES = 60

    def old_map(self, value):
        now = datetime.now(utc)
        dt_value = datetime.fromtimestamp(value, tz=utc)
        time_diff = now - dt_value
        total_seconds = time_diff.total_seconds()
        if total_seconds > self.DAYS:
            diff_str = '{} day(s) ago'.format(int(total_seconds / self.DAYS))
        elif total_seconds > self.HOURS:
            diff_str = '{} hour(s) ago'.format(int(total_seconds / self.HOURS))
        elif total_seconds > self.MINUTES:
            diff_str = '{} minute(s) ago'.format(int(total_seconds / self.MINUTES))
        return dt_value.strftime('%Y-%m-%d %-H:%M:%S ({})'.format(diff_str))

    def map(self, value):
        return datetime.fromtimestamp(value, tz=utc)


class SizeField(Field):

    def map(self, value):
        num = int(value)
        for u in ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB']:
            if abs(num) < 1024.0:
                return "%3.1f %s" % (num, u)
            num /= 1024.0
        return value


class TagField(Field):

    def map(self, value):
        parsed = {}
        if value:
            for repo_tag in value:
                repo, tag = repo_tag.split(':')
                parsed.setdefault(repo, []).append(tag)
        print parsed
        return parsed


class PortField(Field):
    pass


class Action(object):

    ORDER = 0

    def __init__(self, label=None):
        self.order = Field.ORDER
        self.label = label
        Field.ORDER += 1

    def bind(self, name):
        """
        bind this field to the Mapping object containing it
        """
        self.name = name
        self.label = self.label or name

    def map(self, item):
        return {
            'name': self.name,
            'label': self.label
        }


class Mapper(object):

    def __init__(self, data):
        print 'DATA:', data
        self._initialize_fields()
        if not isinstance(data, list):
            data = [data]
        self.data = data

    def _initialize_fields(self):
        fields = []
        actions = []
        for name, field in self.__class__.__dict__.items():
            if isinstance(field, Field):
                fields.append(field)
                field.bind(name)
            elif isinstance(field, Action):
                actions.append(field)
                field.bind(name)
        self.actions = sorted(actions, key=lambda x: x.order)
        self.fields = sorted(fields, key=lambda x: x.order)

    def map_item(self, item):
        mapped_item = {f.field_name: f.map(item[f.source]) for f in self.fields}
        actions = [a.map(item) for a in self.actions]
        mapped_item['actions'] = actions
        return mapped_item

    def map(self):
        return [self.map_item(i) for i in self.data]


class ImageMapper(Mapper):
    repositories = TagField(source='RepoTags')
    created_at = DateTimeField(source='Created')
    image_id = Field(source='Id')
    virtual_size = SizeField(source='VirtualSize')
    run = Action()
    delete = Action()


class ContainerMapper(Mapper):
    container_id = Field(source='Id')
    image = Field(source='Image')
    image_id = Field(source='ImageID')
    command = Field(source='Command')
    created_at = DateTimeField(source='Created')
    status = Field(source='Status')
    ports = PortField(source='Ports')
    names = Field(source='Names')
    stop = Action()
    delete = Action()


@docker_bp.route('images/')
def get_images():
    image_mapper = ImageMapper(docker.images())
    images = image_mapper.map()
    return jsonify({'results': images})


@docker_bp.route('images/<image_id>/<action>', methods=['POST'])
def take_image_action(image_id, action):
    if action == 'run':
        container_info = docker.create_container(image=image_id)
        docker.start(container_info['Id'])
    elif action == 'delete':
        docker.remove_image(image_id)
    else:
        raise ValueError('Unsupported Action.')
    return jsonify({})


@docker_bp.route('images/<image_id>/config', methods=['POST'])
def set_config(image_id):
    pass


@docker_bp.route('containers/')
def get_containers():
    container_mapper = ContainerMapper(docker.containers(all=True))
    containers = container_mapper.map()
    return jsonify({'results': containers})


@docker_bp.route('containers/<container_id>/<action>', methods=['POST'])
def take_container_action(action, container_id):
    if action == 'stop':
        docker.stop(container_id)
    elif action == 'delete':
        docker.remove_container(container_id)
    else:
        raise ValueError('Unsupported Action.')
    return jsonify({})

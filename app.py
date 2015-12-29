import re
from subprocess import check_output

from flask import Flask, render_template, request, redirect


app = Flask(__name__)


white_matcher = re.compile('\s\s+')


@app.route('/')
def index():
    output = check_output(['docker', 'images'])
    output_array = output.split('\n')
    image_headers = output_array[0]
    image_lines = output_array[1:]

    output = check_output(['docker', 'ps', '-a'])
    output_array = output.split('\n')
    container_headers = output_array[0]
    container_lines = output_array[1:]
    return render_template(
        'index.html',
        image_headers=white_matcher.split(image_headers),
        images=[white_matcher.split(image) for image in image_lines if image],
        container_headers=white_matcher.split(container_headers),
        containers=[white_matcher.split(container) for container in container_lines if container]
    )


@app.route('/', methods=['POST'])
def index_post():
    if 'container_id' in request.form:
        print request.form
        check_output(['docker', request.form['action'], request.form['container_id']])
    elif 'image_id' in request.form:
        check_output(
            [
                'docker',
                'run',
                '-d',
                '-p', '5000',
                '-v', '/usr/local/bin/docker:/usr/bin/docker',
                '-v', '/var/run/docker.sock:/var/run/docker.sock',
                request.form['image_id']
            ]
        )
    return redirect('/')


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)

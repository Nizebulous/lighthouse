from flask import Blueprint, render_template


lh = Blueprint('lighthouse', __name__, url_prefix='')


@lh.route('/')
def index():
    return render_template(
        'index.html',
    )
